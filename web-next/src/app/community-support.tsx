import {T} from "@/app/locale-provider";
import {BRAND,repoUrl} from "@/lib/brand";
function Arrow(){return <span aria-hidden="true">↗</span>}
export default function CommunitySupport(){
  const {community,support}=BRAND;
  return <>
    {community.length>0&&<section id="komunitas" className="community-section"><div className="support-heading"><span className="eyebrow">Community</span><h2><T text="Gabung komunitas."/></h2><p><T text="Ikuti kabar terbaru dan berbagi pengalaman bersama pengguna lain."/></p></div><div className="community-grid">{community.map(c=><a key={c.url} className="community-link" href={c.url} target="_blank" rel="noopener noreferrer"><div><h3>{c.label}</h3><p>{c.description}</p></div><Arrow/></a>)}</div></section>}
    <section id="dukungan" className="support-section"><div className="support-heading"><span className="eyebrow">Open source</span><h2><T text="Dukung pengembangannya."/></h2><p><T text="KzRDP dikembangkan oleh Kazama Tech. Star di GitHub sudah sangat membantu."/></p></div>
      <div className="support-grid">{support.map(s=><article key={s.url} className="support-panel"><h3>{s.label}</h3><p>{s.description}</p><a className="button" href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a></article>)}</div>
      <div className="github-support"><a href={repoUrl} target="_blank" rel="noopener noreferrer"><span><T text="Star KzRDP di GitHub"/></span><Arrow/></a></div>
    </section>
  </>
}
