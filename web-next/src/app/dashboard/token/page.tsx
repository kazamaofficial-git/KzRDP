"use client";
import {T} from "@/components/locale-provider";
import {useCallback,useEffect,useState} from "react";
type State={state:string;expires?:number;tg_name?:string|null;email_hint?:string|null;cooldown_until?:number|null;session?:{started:number;ends:number}};
const clock=(ms:number)=>{const s=Math.max(0,Math.floor(ms/1000));return Math.floor(s/3600)+":"+String(Math.floor(s%3600/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")};
export default function TokenPage(){
  const [st,setSt]=useState<State|null>(null),[token,setToken]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[now,setNow]=useState(Date.now()),[copied,setCopied]=useState(false),[email,setEmail]=useState("");
  const load=useCallback(async()=>{const r=await fetch("/api/v1/token",{cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error);setSt(d)},[]);
  useEffect(()=>{load().catch(e=>setError(e.message));const poll=setInterval(()=>load().catch(()=>{}),15000),tick=setInterval(()=>setNow(Date.now()),1000);return()=>{clearInterval(poll);clearInterval(tick)}},[load]);
  async function create(){setBusy(true);setError("");try{const r=await fetch("/api/v1/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});const d=await r.json();if(!r.ok)throw Error(d.error);setToken(d.token);setCopied(false);await load()}catch(e){setError(e instanceof Error?e.message:"Gagal membuat token")}finally{setBusy(false)}}
  async function copy(){try{await navigator.clipboard.writeText(token);setCopied(true)}catch{setError("Salin manual: blok teks token lalu salin.")}}
  const s=st?.state||"…";
  return <><span className="eyebrow">Workspace / Token</span><h1><T text="Token RDP"/></h1>
  <p><T text="Token dibuat di sini, diverifikasi di grup Telegram, lalu dipakai saat menjalankan workflow. Data RDP dikirim ke Telegram; halaman ini hanya menampilkan status dan sisa waktu."/></p>
  <section className="card"><h2><T text="Status"/>: <code data-state={s}>{s}</code></h2>
   {st?.state==="active"&&st.session&&<p>{clock(st.session.ends-now)} <T text="tersisa"/></p>}
   {(st?.state==="pending"||st?.state==="verified")&&st.expires&&<p><T text="Token berlaku "/>{clock(st.expires-now)}{st.tg_name?<> · {st.tg_name}</>:null}</p>}
   {(st?.state==="pending"||st?.state==="verified")&&st.email_hint&&<p><T text="Email pemilik: "/><b>{st.email_hint}</b></p>}
   {st?.cooldown_until&&st.cooldown_until>now&&<p><T text="Token baru bisa dibuat dalam "/>{clock(st.cooldown_until-now)}</p>}
   {error&&<p className="error" role="alert"><T text={error}/></p>}
   {token&&<div className="token-reveal"><p className="guide" role="status"><T text="Simpan token ini sekarang. Ia hanya tampil sekali dan tidak bisa dilihat lagi."/></p><code className="token-code">{token}</code><div className="actions"><button onClick={copy}><T text={copied?"Tersalin":"Salin token"}/></button></div></div>}
   <label htmlFor="token-email"><T text="Email pemilik token"/></label><input id="token-email" type="email" inputMode="email" autoComplete="email" placeholder="nama@email.com" value={email} onChange={e=>setEmail(e.target.value)} disabled={busy||!st||st.state!=="none"}/>
   <p className="muted"><T text="Email ini harus sama saat menjalankan workflow. Jika berbeda, build ditolak."/></p>
   <div className="actions"><button disabled={busy||!st||st.state!=="none"||!email.includes("@")} onClick={create}><T text="Buat token"/></button></div>
   {st&&st.state!=="none"&&!token&&<p className="muted"><T text="Tombol aktif lagi saat tidak ada token berlaku, RDP aktif, atau jeda 1 jam sesudah RDP selesai."/></p>}
  </section>
  <section className="card"><h2><T text="Langkah"/></h2><ol className="guide-list"><li><T text="Buat token di atas."/></li><li><T text="Di grup Telegram yang diizinkan kirim: "/><code>/verif RDP-XXXXXXXXXX</code></li><li><T text="Jika bot belum di-Start, Telegram meminta kamu Start dulu. Setelah itu kirim /verif lagi."/></li><li><T text="Mulai RDP dari tombol Mulai RDP di Home (token dan email terisi otomatis), atau jalankan workflow GitHub dengan token dan emailmu. Tanpa token terverifikasi, build ditolak."/></li></ol></section></>
}
