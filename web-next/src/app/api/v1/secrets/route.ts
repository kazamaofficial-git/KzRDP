import {NextRequest} from "next/server";
import {context,guarded,reply,origin,body,gh,ApiError} from "@/lib/core/api";
import {db} from "@/lib/core/db";
import {githubSealedBox,sealPassword} from "@/lib/auth/vault";
export async function POST(req:NextRequest){return guarded(async()=>{
 const c=await context(req,true);origin(req);const data=await body(req);
 const password=typeof data.password==="string"?data.password:"",tailscale=typeof data.tailscale==="string"?data.tailscale.trim():"";
 if(!password&&!tailscale)throw new ApiError(400,"Isi minimal satu secret untuk disimpan");
 if(password&&(password.length<12||password.length>128||/[\x00-\x1f]/.test(password)||[/[a-z]/,/[A-Z]/,/[0-9]/,/[^a-zA-Z0-9]/].filter(r=>r.test(password)).length<3))throw new ApiError(400,"Password RDP minimal 12 karakter, maksimal 128, dengan minimal 3 jenis: huruf kecil, huruf besar, angka, simbol");
 if(tailscale&&(!tailscale.startsWith("tskey-auth-")||tailscale.length>512||/\s/.test(tailscale)))throw new ApiError(400,"Gunakan Tailscale auth key (tskey-auth-...), bukan API key");
 const r=await gh<{permissions?:{push?:boolean}}>(c,"");if(!c.installationId&&!r.permissions?.push)throw new ApiError(403,"Akses tulis repository diperlukan");
 const publicKey=await gh<{key:string;key_id:string}>(c,"/actions/secrets/public-key");const saved:string[]=[];let stored=false,warning="";
 // Store Tailscale first. Every saved value is independently retryable; blanks leave secrets unchanged.
 for(const [name,value] of [["TAILSCALE_AUTH_KEY",tailscale],["RDP_PASSWORD",password]])if(value){
  await gh(c,"/actions/secrets/"+name,"PUT",{encrypted_value:githubSealedBox(publicKey.key,value),key_id:publicKey.key_id});saved.push(name);
  if(name==="RDP_PASSWORD"){
   // Secret sudah tersimpan di GitHub; salinan terenkripsi di dashboard bersifat tambahan, jadi kegagalannya tidak membatalkan hasil.
   try{await db().prepare("DELETE FROM credentials WHERE repo=?").bind(c.repo).run();}catch{}
   if(data.remember===true){try{const metadata=await gh<{updated_at:string}>(c,"/actions/secrets/RDP_PASSWORD");await db().prepare("INSERT INTO credentials(repo,payload,remote_updated,updated) VALUES(?,?,?,?)").bind(c.repo,sealPassword(c.repo,password),metadata.updated_at,Date.now()).run();stored=true;}catch{warning="Secret tersimpan di GitHub, tetapi salinan terenkripsi di dashboard gagal disimpan (tabel credentials sudah dibuat di D1?).";}}
  }
 }
 return reply({ok:true,saved,password_stored:stored,warning});
})}
