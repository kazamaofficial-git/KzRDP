import {T} from "@/app/locale-provider";
const rows=[["Windows Server","2025 · x64"],["Akses","Tailscale privat"],["Klien","XyDesk Remote"]];
export default function HeroVisual(){
  return <div className="hero-visual" aria-hidden="true">
    <div className="hv-glow"/>
    <div className="hv-card">
      <div className="hv-bar"><i/><i/><i/><span>kzrdp-session</span></div>
      <div className="hv-timer"><small><T text="Sisa waktu sesi"/></small><strong>05:59:42</strong></div>
      <div className="hv-progress"><span/></div>
      <ul>{rows.map(([k,v])=><li key={k}><span>{k}</span><b>{v}</b></li>)}</ul>
      <div className="hv-status"><i/><T text="Contoh tampilan sesi"/></div>
    </div>
    <div className="hv-chip hv-chip-a"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="13" rx="3"/><path d="M8 21h8M12 17v4"/></svg></div>
    <div className="hv-chip hv-chip-b"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3 4 7v5c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V7l-8-4Zm-3 9 2.2 2.2L15.5 10"/></svg></div>
  </div>
}
