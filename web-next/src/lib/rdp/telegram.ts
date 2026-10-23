// Klien Telegram Bot API minimal. TELEGRAM_BOT_TOKEN tidak pernah dicatat atau dikirim ke klien.
type Result={ok:boolean;error_code?:number;description?:string};
export const esc=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
export async function tg(method:string,data:Record<string,unknown>):Promise<Result>{
  const token=process.env.TELEGRAM_BOT_TOKEN;
  if(!token)return {ok:false,error_code:0,description:"TELEGRAM_BOT_TOKEN belum diisi"};
  try{
    const r=await fetch("https://api.telegram.org/bot"+token+"/"+method,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data),signal:AbortSignal.timeout(10000)});
    return await r.json() as Result;
  }catch{return {ok:false,error_code:0,description:"Telegram tidak terjangkau"}}
}
export const send=(chat_id:string|number,text:string)=>tg("sendMessage",{chat_id,text,parse_mode:"HTML",disable_web_page_preview:true});
