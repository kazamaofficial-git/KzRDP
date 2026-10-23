import {NextRequest} from "next/server";
import {guarded,reply,body,ApiError} from "@/lib/core/api";
import {db,rateLimit} from "@/lib/core/db";
import {sessionAuth,COOLDOWN_MS} from "@/lib/rdp/token";
import {send,esc} from "@/lib/rdp/telegram";
import {BRAND} from "@/lib/config/brand";
const str=(v:unknown,max:number)=>typeof v==="string"&&v.length<=max?v:"";
// Dipanggil workflow: event "ready" (kirim data RDP ke Telegram) dan "ended" (sesi selesai).
export async function POST(req:NextRequest){return guarded(async()=>{
  const b=await body(req);
  const s=await sessionAuth(str(b.session_id,64),str(b.session_key,128));
  const target=s.tg_id;
  if(b.event==="ready"){
    if(!await rateLimit("rdp-report:"+s.id,5,3600))throw new ApiError(429,"Terlalu banyak laporan");
    const host=str(b.host,253),port=Number(b.port),user=str(b.username,40),pw=str(b.password,128);
    if(!/^[A-Za-z0-9.-]{1,253}$/.test(host)||!Number.isInteger(port)||port<1||port>65535||!/^[A-Za-z0-9._-]{1,40}$/.test(user)||/[\x00-\x1f]/.test(pw))throw new ApiError(400,"Data koneksi tidak valid");
    const text="✅ <b>RDP aktif</b>\n\nHost: <code>"+esc(host)+"</code>\nPort: <code>"+port+"</code>\nUsername: <code>"+esc(user)+"</code>"+(pw?"\nPassword: <code>"+esc(pw)+"</code>":"")+"\nBerakhir: "+new Date(s.ends).toUTCString()+"\n\nBuka dengan XyDesk Remote: "+BRAND.xydeskUrl+"\nSimpan pesan ini; jangan bagikan ke orang lain.";
    const r=target?await send(target,text):{ok:false};
    return reply({ok:true,delivered:!!r.ok});
  }
  if(b.event==="ended"){
    await db().prepare("UPDATE rdp_sessions SET ended=? WHERE id=? AND ended IS NULL").bind(Date.now(),s.id).run();
    if(target)await send(target,"⏹ <b>RDP selesai</b>\nToken baru bisa dibuat "+Math.round(COOLDOWN_MS/60000)+" menit lagi di dashboard.");
    return reply({ok:true});
  }
  throw new ApiError(400,"event tidak dikenal");
})}
