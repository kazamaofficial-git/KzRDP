import {randomBytes,randomUUID,timingSafeEqual} from "node:crypto";
import {db,rateLimit} from "../core/db";
import {hash,ApiError} from "../core/api";
// Aturan: token tampil sekali; tidak bisa dibuat saat ada RDP aktif; setelah RDP selesai tunggu 1 jam.
export const VERIFY_WINDOW_MS=30*60*1000;   // token harus diverifikasi di Telegram dalam 30 menit
export const USE_WINDOW_MS=60*60*1000;      // setelah diverifikasi, harus dipakai workflow dalam 60 menit
export const COOLDOWN_MS=60*60*1000;        // jeda sesudah RDP berakhir sebelum token baru
const ALPHABET="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 karakter, tanpa 0/O/1/I
export const TOKEN_RE=/^RDP-[A-HJ-NP-Z2-9]{10}$/;
export const normalize=(t:string)=>t.trim().toUpperCase();
export function newToken(){let s="";for(const x of randomBytes(10))s+=ALPHABET[x%32];return "RDP-"+s;}
export type TokenRow={hash:string;subject:string;login:string;created:number;expires:number;tg_id:string|null;tg_name:string|null;verified_at:number|null;used_at:number|null;email:string|null};
type SessionRow={id:string;subject:string;token_hash:string;key_hash:string;tg_id:string|null;started:number;ends:number;ended:number|null};
export const EMAIL_RE=/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
export const maskEmail=(e:string)=>e.replace(/^(.)[^@]*@(.)[^.]*(\..+)$/,"$1***@$2***$3");
export const minutes=(ms:number)=>Math.max(1,Math.ceil(ms/60000));
export async function tokenState(subject:string){
  const now=Date.now();
  const active=await db().prepare("SELECT id,started,ends FROM rdp_sessions WHERE subject=? AND ended IS NULL AND ends>? ORDER BY started DESC LIMIT 1").bind(subject,now).first<{id:string;started:number;ends:number}>();
  if(active)return {state:"active" as const,session:{started:active.started,ends:active.ends}};
  const last=await db().prepare("SELECT COALESCE(ended,ends) AS at FROM rdp_sessions WHERE subject=? ORDER BY started DESC LIMIT 1").bind(subject).first<{at:number}>();
  const until=last?last.at+COOLDOWN_MS:0;
  const tok=await db().prepare("SELECT * FROM rdp_tokens WHERE subject=? AND used_at IS NULL AND expires>? ORDER BY created DESC LIMIT 1").bind(subject,now).first<TokenRow>();
  if(tok)return {state:(tok.verified_at?"verified":"pending") as "verified"|"pending",expires:tok.expires,tg_name:tok.tg_name,email_hint:tok.email?maskEmail(tok.email):null,cooldown_until:until>now?until:null};
  if(until>now)return {state:"cooldown" as const,cooldown_until:until};
  return {state:"none" as const};
}
export async function createToken(subject:string,login:string,email:string){
  if(!EMAIL_RE.test(email))throw new ApiError(400,"Isi email pemilik token dengan format yang benar");
  const st=await tokenState(subject);
  if(st.state==="active")throw new ApiError(409,"Masih ada RDP aktif. Token baru bisa dibuat 1 jam setelah RDP berakhir.");
  if(st.state==="cooldown")throw new ApiError(429,"Token baru bisa dibuat "+minutes(st.cooldown_until-Date.now())+" menit lagi.");
  if(st.state==="pending"||st.state==="verified")throw new ApiError(409,"Token sebelumnya masih berlaku ("+minutes(st.expires-Date.now())+" menit lagi). Token hanya ditampilkan sekali; tunggu sampai kedaluwarsa jika hilang.");
  const token=newToken(),now=Date.now();
  await db().prepare("INSERT INTO rdp_tokens(hash,subject,login,created,expires,email) VALUES(?,?,?,?,?,?)").bind(hash(token),subject,login,now,now+VERIFY_WINDOW_MS,email.trim().toLowerCase()).run();
  return {token,expires:now+VERIFY_WINDOW_MS};
}
export async function findToken(text:string){
  const t=normalize(text);if(!TOKEN_RE.test(t))return null;
  return db().prepare("SELECT * FROM rdp_tokens WHERE hash=?").bind(hash(t)).first<TokenRow>();
}
export async function markVerified(h:string,tgId:string,tgName:string){
  const now=Date.now();
  const r=await db().prepare("UPDATE rdp_tokens SET tg_id=?,tg_name=?,verified_at=?,expires=? WHERE hash=? AND verified_at IS NULL AND used_at IS NULL AND expires>?").bind(tgId,tgName,now,now+USE_WINDOW_MS,h,now).run();
  return r.meta.changes===1;
}
export async function unverify(h:string){await db().prepare("UPDATE rdp_tokens SET tg_id=NULL,tg_name=NULL,verified_at=NULL WHERE hash=? AND used_at IS NULL").bind(h).run();}
export async function startSession(tokenText:string,durationMinutes:number,email:string,github:string){
  const t=normalize(tokenText);if(!TOKEN_RE.test(t))throw new ApiError(400,"Format token salah");
  const h=hash(t),now=Date.now();
  const row=await db().prepare("SELECT * FROM rdp_tokens WHERE hash=?").bind(h).first<TokenRow>();
  if(!row)throw new ApiError(404,"Token tidak ditemukan");
  if(row.used_at)throw new ApiError(409,"Token sudah dipakai");
  if(!row.verified_at||!row.tg_id)throw new ApiError(403,"Token belum diverifikasi. Kirim /verif TOKEN di grup Telegram yang diizinkan.");
  if(row.expires<=now)throw new ApiError(410,"Token kedaluwarsa");
  // Token + email + username GitHub harus milik orang yang sama; jika tidak cocok, bukan pemiliknya dan build ditolak.
  const gh=github.trim().replace(/^@/,"").toLowerCase();
  if(!row.email||email.trim().toLowerCase()!==row.email||!gh||gh!==row.login.toLowerCase()){
    if(!await rateLimit("rdp-id:"+h,3,3600))throw new ApiError(429,"Terlalu banyak percobaan identitas salah untuk token ini. Coba lagi nanti.");
    throw new ApiError(403,"Email atau username GitHub tidak sesuai dengan pemilik token. Build ditolak.");
  }
  const claim=await db().prepare("UPDATE rdp_tokens SET used_at=? WHERE hash=? AND used_at IS NULL").bind(now,h).run();
  if(claim.meta.changes!==1)throw new ApiError(409,"Token sudah dipakai");
  const id=randomUUID(),key=randomBytes(24).toString("hex"),ends=now+durationMinutes*60000;
  await db().prepare("INSERT INTO rdp_sessions(id,subject,token_hash,key_hash,tg_id,started,ends) VALUES(?,?,?,?,?,?,?)").bind(id,row.subject,h,hash(key),row.tg_id,now,ends).run();
  return {id,key,ends,tg_id:row.tg_id,login:row.login};
}
export async function sessionAuth(id:string,key:string){
  const row=await db().prepare("SELECT * FROM rdp_sessions WHERE id=?").bind(id).first<SessionRow>();
  const a=Buffer.from(hash(key)),b=Buffer.from(row?.key_hash||"0".repeat(64));
  if(!row||a.length!==b.length||!timingSafeEqual(a,b))throw new ApiError(401,"Sesi tidak valid");
  return row;
}
// Dipakai tombol Mulai RDP di dashboard: menukar token terverifikasi menjadi tiket sekali pakai untuk workflow.
export async function issueTicket(subject:string){
  const now=Date.now();
  const row=await db().prepare("SELECT * FROM rdp_tokens WHERE subject=? AND verified_at IS NOT NULL AND used_at IS NULL AND expires>? ORDER BY created DESC LIMIT 1").bind(subject,now).first<TokenRow>();
  if(!row||!row.email)throw new ApiError(403,"Belum ada token terverifikasi. Buat token di menu Token, lalu verifikasi di grup Telegram.");
  const claim=await db().prepare("UPDATE rdp_tokens SET used_at=? WHERE hash=? AND used_at IS NULL").bind(now,row.hash).run();
  if(claim.meta.changes!==1)throw new ApiError(409,"Token sedang dipakai");
  const ticket=newToken(),th=hash(ticket);
  await db().prepare("INSERT INTO rdp_tokens(hash,subject,login,created,expires,tg_id,tg_name,verified_at,email) VALUES(?,?,?,?,?,?,?,?,?)").bind(th,row.subject,row.login,now,now+USE_WINDOW_MS/2,row.tg_id,row.tg_name,row.verified_at,row.email).run();
  return {ticket,email:row.email,login:row.login,rollback:async()=>{await db().prepare("DELETE FROM rdp_tokens WHERE hash=?").bind(th).run();await db().prepare("UPDATE rdp_tokens SET used_at=NULL WHERE hash=?").bind(row.hash).run();}};
}
