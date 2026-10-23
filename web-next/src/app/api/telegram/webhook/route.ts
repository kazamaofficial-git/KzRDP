import {NextRequest} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {db,rateLimit} from "@/lib/core/db";
import {send,tg,esc} from "@/lib/rdp/telegram";
import {findToken,markVerified,unverify,TOKEN_RE,normalize,minutes,maskEmail} from "@/lib/rdp/token";
import {BRAND} from "@/lib/config/brand";
type Msg={message_id:number;text?:string;chat:{id:number;type:string};from?:{id:number;is_bot?:boolean;username?:string;first_name?:string}};
const bot=()=>process.env.TELEGRAM_BOT_USERNAME?"@"+process.env.TELEGRAM_BOT_USERNAME.replace(/^@/,""):"bot ini";
const GUIDE="<b>Panduan KzRDP</b>\n\n1. Buka dashboard "+BRAND.siteUrl+" lalu menu <b>Token</b>, tekan <i>Buat token</i> (hanya tampil sekali).\n2. Di grup yang diizinkan, kirim <code>/verif RDP-XXXXXXXXXX</code>.\n3. Jalankan workflow GitHub dengan token itu. Data RDP dikirim ke chat ini.\n4. Dashboard hanya menampilkan sisa waktu dan tombol Stop.\n\nPerintah: /start /panduan /verif /status\nBantuan: "+BRAND.contacts.map(c=>esc(c.description)).join(" · ");
async function handle(m:Msg){
  if(!m.text||!m.from||m.from.is_bot)return;
  const from=m.from,chat=m.chat;
  if(!await rateLimit("tg:"+from.id,20,60))return;
  const [first,...rest]=m.text.trim().split(/\s+/);
  if(!first.startsWith("/"))return;
  const cmd=first.split("@")[0].toLowerCase();
  const group=chat.type==="group"||chat.type==="supergroup";
  if(cmd==="/start"){await send(chat.id,"👋 <b>KzRDP Bot aktif.</b>\nData RDP-mu akan dikirim ke chat ini setelah token diverifikasi di grup.\n\nKetik /panduan untuk langkah lengkap.");return}
  if(cmd==="/panduan"||cmd==="/help"){await send(chat.id,GUIDE);return}
  if(cmd==="/status"){
    const s=await db().prepare("SELECT started,ends,ended FROM rdp_sessions WHERE tg_id=? ORDER BY started DESC LIMIT 1").bind(String(from.id)).first<{started:number;ends:number;ended:number|null}>();
    const now=Date.now();
    await send(chat.id,s&&!s.ended&&s.ends>now?"🟢 RDP aktif, sisa <b>"+minutes(s.ends-now)+" menit</b>.":"⚪ Tidak ada RDP aktif.");return}
  if(cmd==="/verif"){
    if(!group){await send(chat.id,"Verifikasi hanya bisa di grup resmi. Kirim <code>/verif RDP-XXXXXXXXXX</code> di sana.");return}
    const allowed=(process.env.TELEGRAM_ALLOWED_CHATS||"").split(",").map(s=>s.trim()).filter(Boolean);
    if(!allowed.includes(String(chat.id))){await send(chat.id,"Grup ini tidak diizinkan untuk verifikasi.");return}
    // Token sengaja dihapus dari grup secepatnya (butuh bot jadi admin dengan izin hapus pesan).
    await tg("deleteMessage",{chat_id:chat.id,message_id:m.message_id});
    const text=normalize(rest[0]||"");
    const name=from.username?"@"+from.username:(from.first_name||String(from.id));
    if(!TOKEN_RE.test(text)){await send(chat.id,esc(name)+", format: <code>/verif RDP-XXXXXXXXXX</code>");return}
    const row=await findToken(text);
    if(!row||row.used_at||row.expires<=Date.now()){await send(chat.id,esc(name)+", token tidak valid, kedaluwarsa, atau sudah dipakai.");return}
    if(row.verified_at){await send(chat.id,esc(name)+", token ini sudah diverifikasi.");return}
    if(!await markVerified(row.hash,String(from.id),name)){await send(chat.id,esc(name)+", token gagal diverifikasi. Coba lagi.");return}
    const dm=await send(from.id,"✅ <b>Token aktif</b>\nAkun dashboard: <b>"+esc(row.login)+"</b>\nEmail pemilik: <b>"+esc(row.email?maskEmail(row.email):"-")+"</b> (harus sama saat menjalankan workflow)\nBerlaku untuk dipakai: <b>60 menit</b>.\n\nSekarang jalankan workflow GitHub dengan token tersebut. Data RDP akan dikirim ke chat ini.");
    if(!dm.ok){
      await unverify(row.hash);
      await send(chat.id,esc(name)+", kamu belum memulai bot. Buka "+esc(bot())+", tekan <b>Start</b>, lalu kirim <code>/verif</code> lagi dengan token yang sama.");return}
    await send(chat.id,"✅ "+esc(name)+" — token berhasil diverifikasi. Detail dikirim ke DM.");return}
}
export async function POST(req:NextRequest){
  const secret=process.env.TELEGRAM_WEBHOOK_SECRET||"",got=req.headers.get("x-telegram-bot-api-secret-token")||"";
  const a=Buffer.from(secret),b=Buffer.from(got);
  if(!secret||a.length!==b.length||!timingSafeEqual(a,b))return new Response("forbidden",{status:403});
  try{const u=await req.json() as {message?:Msg};if(u.message)await handle(u.message)}catch(e){console.warn("[telegram] gagal:",e instanceof Error?e.message:"error")}
  return Response.json({ok:true});
}
