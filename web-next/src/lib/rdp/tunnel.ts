import {db} from "../core/db";
// Tunnel domain ke RDP lewat server bore milik sendiri. Semua nilai berasal dari secret/variabel Worker,
// tidak pernah dari repo publik, dan endpoint hanya dikirim ke Telegram pemilik token.
export type TunnelConfig={host:string;secret:string;bore_url:string;bore_sha256:string;min:number;max:number};
export function tunnelConfig():TunnelConfig|null{
  const e=process.env;
  if(!e.TUNNEL_HOST||!e.TUNNEL_SECRET||!e.TUNNEL_BORE_URL||!/^[0-9a-fA-F]{64}$/.test(e.TUNNEL_BORE_SHA256||""))return null;
  if(!/^https:\/\//.test(e.TUNNEL_BORE_URL)||!/^[A-Za-z0-9.-]{1,253}$/.test(e.TUNNEL_HOST))return null;
  const min=Number(e.TUNNEL_PORT_MIN)||20000,max=Number(e.TUNNEL_PORT_MAX)||29999;
  if(!(min>=1024&&max<=65535&&min<max))return null;
  return {host:e.TUNNEL_HOST,secret:e.TUNNEL_SECRET,bore_url:e.TUNNEL_BORE_URL,bore_sha256:e.TUNNEL_BORE_SHA256.toUpperCase(),min,max};
}
// Memilih port acak di rentang yang belum dipakai sesi aktif lain.
export async function allocatePort(sessionId:string,cfg:TunnelConfig){
  const now=Date.now();
  for(let i=0;i<30;i++){
    const port=cfg.min+Math.floor(Math.random()*(cfg.max-cfg.min+1));
    const used=await db().prepare("SELECT 1 AS x FROM rdp_sessions WHERE port=? AND ended IS NULL AND ends>? LIMIT 1").bind(port,now).first<{x:number}>();
    if(used)continue;
    await db().prepare("UPDATE rdp_sessions SET port=? WHERE id=?").bind(port,sessionId).run();
    return port;
  }
  return null;
}
