import {T} from "@/components/locale-provider";
import {BRAND,repoUrl} from "@/lib/config/brand";
function Arrow(){return <span aria-hidden="true">↗</span>}
export default function CommunitySupport(){
  const {contacts,qrisUrl}=BRAND;
  return <>
    {contacts.length>0&&<section id="bantuan" className="community-section"><div className="support-heading"><span className="eyebrow">Support</span><h2><T text="Butuh bantuan?"/></h2><p><T text="Hubungi kami lewat Telegram atau email."/></p></div><div className="community-grid">{contacts.map(c=><a key={c.url} className="community-link" href={c.url} target={c.url.startsWith("http")?"_blank":undefined} rel="noopener noreferrer"><div><h3>{c.label}</h3><p>{c.description}</p></div><Arrow/></a>)}</div></section>}
    <section id="dukungan" className="support-section"><div className="support-heading"><span className="eyebrow">Donasi</span><h2><T text="Dukung pengembangannya."/></h2><p><T text="Donasi lewat QRIS: scan dengan e-wallet atau m-banking apa pun."/></p></div>
      {qrisUrl&&<div className="qris-card"><div className="qris-frame">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={qrisUrl} alt="QRIS donasi KzRDP" loading="lazy"/></div><p className="muted"><T text="Gambar tidak muncul? Muat ulang halaman."/></p></div>}
      <div className="github-support"><a href={repoUrl} target="_blank" rel="noopener noreferrer"><span><T text="Star KzRDP di GitHub"/></span><Arrow/></a></div>
    </section>
  </>
}
