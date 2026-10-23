import {NextRequest} from "next/server";
import {guarded,body,ApiError} from "@/lib/core/api";
import {rateLimit} from "@/lib/core/db";
import {sessionAuth} from "@/lib/rdp/token";
import bundle from "@/generated/rdp-bundle.json";
// Paket skrip + aset build. Hanya sesi terverifikasi yang bisa mengunduh; repo publik tidak berisi skrip ini,
// jadi tanpa langkah verifikasi di workflow tidak ada yang bisa dijalankan.
export async function POST(req:NextRequest){return guarded(async()=>{
  const b=await body(req);
  const s=await sessionAuth(typeof b.session_id==="string"?b.session_id.slice(0,64):"",typeof b.session_key==="string"?b.session_key.slice(0,128):"");
  if(s.ended||s.ends<=Date.now())throw new ApiError(410,"Sesi sudah berakhir");
  if(!await rateLimit("rdp-bundle:"+s.id,3,3600))throw new ApiError(429,"Paket sudah diunduh terlalu sering untuk sesi ini");
  return new Response(JSON.stringify(bundle),{headers:{"Content-Type":"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
})}
