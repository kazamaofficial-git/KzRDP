import {SITE_HOST,SITE_ORIGIN} from "../config/brand";
import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import {recordCommunityLogin} from "../community/community";
import {rateLimit} from "../core/db";
import {createHash,timingSafeEqual} from "node:crypto";
// Alamat situs berasal dari brand.ts. Menimpa NEXTAUTH_URL dari luar agar nilai yang salah format
// (kutip, spasi, tanpa https) tidak bisa merusak login.
process.env.NEXTAUTH_URL=SITE_ORIGIN;
// Alasan penolakan login admin dicatat (tanpa data rahasia); lihat dengan: npx wrangler tail
// Mode diagnosis: jika variabel ADMIN_LOGIN_DEBUG=1, alasan juga ditampilkan di halaman login. Hapus variabel itu setelah selesai.
function deny(reason:string):null{console.warn("[admin-login] ditolak:",reason);if(process.env.ADMIN_LOGIN_DEBUG==="1")throw new Error(reason);return null;}
export const authOptions: NextAuthOptions = {
 useSecureCookies: SITE_ORIGIN.startsWith("https://"),
 secret: process.env.NEXTAUTH_SECRET,
 providers: [
 GitHubProvider({clientId: process.env.GITHUB_ID || "", clientSecret: process.env.GITHUB_SECRET || "", authorization: {params: {scope: "read:user"}}}),
 Credentials({name:"Admin",credentials:{email:{label:"Email",type:"email"},password:{label:"Password",type:"password"},turnstile:{label:"Turnstile",type:"text"}},async authorize(c,req){
  if(!c?.email||!c.password||!c.turnstile||c.password.length>256||c.turnstile.length>2048)return deny("email/password/turnstile kosong atau terlalu panjang");
  const missing=["ADMIN_PASSWORD_HASH","ADMIN_EMAIL","ADMIN_CREDENTIAL_VERSION","TURNSTILE_SECRET_KEY"].filter(k=>!process.env[k]);
  if(missing.length)return deny("secret belum diisi: "+missing.join(", "));
  const turnstileSecret=process.env.TURNSTILE_SECRET_KEY as string,adminHash=process.env.ADMIN_PASSWORD_HASH as string,adminEmail=process.env.ADMIN_EMAIL as string;
  const ip=String(req.headers?.["cf-connecting-ip"]||"unknown");
  const bucket=createHash("sha256").update(ip).digest("hex");
  if(!await rateLimit("admin:"+bucket,5,900))return deny("terlalu banyak percobaan (maks 5 per 15 menit per IP)");
  const r=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:new URLSearchParams({secret:turnstileSecret,response:c.turnstile,remoteip:ip}),signal:AbortSignal.timeout(10000)});
  const check=await r.json();if(!check.success||check.hostname!==SITE_HOST||check.action!=="admin_login")return deny("turnstile gagal: success="+check.success+", hostname="+check.hostname+" (harus "+SITE_HOST+"), action="+check.action+", error="+JSON.stringify(check["error-codes"]||[]));
  const [salt,expected]=adminHash.split(":");
  if(!salt||!expected)return deny("format ADMIN_PASSWORD_HASH salah (harus salt:hash)");
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(c.password),"PBKDF2",false,["deriveBits"]);
  const result=await crypto.subtle.deriveBits({name:"PBKDF2",salt:new TextEncoder().encode(salt),iterations:100000,hash:"SHA-256"},key,256);
  const a=Buffer.from(result),z=Buffer.from(expected,"hex");
  if(a.length!==z.length||!timingSafeEqual(a,z))return deny("password tidak cocok dengan ADMIN_PASSWORD_HASH");
  if(c.email.trim().toLowerCase()!==adminEmail.toLowerCase())return deny("email tidak cocok dengan ADMIN_EMAIL");
  return {id:"kzrdp-admin",name:"Admin",email:adminEmail};
 }})],
 session: {strategy: "jwt", maxAge: 30*24*60*60},
 pages: {signIn: "/login"},
 callbacks: {
  async jwt({token,account,profile,user}) {
   if(account?.provider === "github") {const avatar=(profile as {avatar_url?:string})?.avatar_url;token.picture=typeof avatar==="string"&&/^https:\/\/avatars\.githubusercontent\.com\//.test(avatar)?avatar:null;delete token.accessToken;token.login=(profile as {login?:string})?.login;token.githubId=account.providerAccountId;token.authKind="github";delete token.credVersion;try{await recordCommunityLogin(account.providerAccountId,String(token.login||""))}catch{console.warn("Community login count unavailable; authentication continues");}}
   if(account?.provider === "credentials"&&user?.id==="kzrdp-admin"){token.authKind="admin";token.credVersion=process.env.ADMIN_CREDENTIAL_VERSION;token.login="Admin";delete token.accessToken;delete token.githubId;}
   if(token.authKind==="github")delete token.accessToken;
   token.role=token.authKind==="admin"&&!!process.env.ADMIN_CREDENTIAL_VERSION&&token.credVersion===process.env.ADMIN_CREDENTIAL_VERSION?"admin":"user";
   return token;
  },
  async session({session,token}) {if(session.user)session.user.name=String(token.login||session.user.name||"");if(session.user){session.user.image=typeof token.picture==="string"&&/^https:\/\/avatars\.githubusercontent\.com\//.test(token.picture)?token.picture:null;}session.role=token.role==="admin"?"admin":"user";return session;}
 }
};
