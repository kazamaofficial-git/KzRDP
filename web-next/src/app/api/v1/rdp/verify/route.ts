import {NextRequest} from "next/server";
import {guarded,reply,body,hash,ApiError} from "@/lib/core/api";
import {rateLimit} from "@/lib/core/db";
import {startSession,maskEmail} from "@/lib/rdp/token";
import {tunnelConfig,allocatePort} from "@/lib/rdp/tunnel";
import {send,esc} from "@/lib/rdp/telegram";
// Dipanggil workflow GitHub saat build dimulai. Otorisasi = token terverifikasi + email + username GitHub pemilik token.
export async function POST(req:NextRequest){return guarded(async()=>{
  const ip=req.headers.get("cf-connecting-ip")||"unknown";
  if(!await rateLimit("rdp-verify:"+hash(ip),10,600))throw new ApiError(429,"Terlalu banyak percobaan");
  const b=await body(req);
  const token=typeof b.token==="string"?b.token:"";
  const rawMinutes=String(b.minutes??"").trim();
  if(!/^\d{1,3}$/.test(rawMinutes)||Number(rawMinutes)<10||Number(rawMinutes)>360)throw new ApiError(400,"Durasi harus angka 10–360 menit");
  const minutes=Number(rawMinutes);
  const email=typeof b.email==="string"?b.email.trim().slice(0,120):"";
  const github=typeof b.github==="string"?b.github.trim().slice(0,60):"";
  if(!email)throw new ApiError(400,"Email wajib diisi (email pemilik token)");
  if(!github)throw new ApiError(400,"Username GitHub wajib diisi");
  const akses=b.akses==="tunnel"?"tunnel":"other";
  const cfg=akses==="tunnel"?tunnelConfig():null;
  if(akses==="tunnel"&&!cfg)throw new ApiError(503,"Tunnel belum dikonfigurasi di server. Pilih akses lain atau hubungi admin.");
  const s=await startSession(token,minutes,email,github);
  let tunnel:{host:string;port:number;secret:string;bore_url:string;bore_sha256:string}|undefined;
  if(cfg){const port=await allocatePort(s.id,cfg);if(!port)throw new ApiError(503,"Tidak ada port tunnel kosong. Coba lagi sebentar lagi.");tunnel={host:cfg.host,port,secret:cfg.secret,bore_url:cfg.bore_url,bore_sha256:cfg.bore_sha256}}
  await send(s.tg_id!,"▶️ <b>Build KzRDP dimulai</b>\nDurasi maksimal: "+minutes+" menit.\nEmail: "+esc(maskEmail(email))+"\nData RDP dikirim ke sini begitu siap.");
  return reply({session_id:s.id,session_key:s.key,ends_at:new Date(s.ends).toISOString(),tunnel},201);
})}
