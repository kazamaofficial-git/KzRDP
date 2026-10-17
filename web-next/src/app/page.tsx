import {T} from "@/app/locale-provider";
import HeroVisual from "./hero-visual";
import CommunityStats from "./community-stats";
import GitHubIcon from "./github-icon";
import Link from "next/link";
import Navigation from "./dashboard/navigation";
import CommunitySupport from "./community-support";
import BrandSlider from "./brand-slider";
import TutorialVideo from "./tutorial-video";
import {tutorialVideo} from "@/lib/tutorial";
import {BRAND,repoUrl} from "@/lib/brand";
const features=[
  ["6 jam penuh","Sesi Windows hingga 360 menit per run, termasuk waktu persiapan."],
  ["Tailscale privat","Tanpa tunnel publik. Hanya perangkat di tailnet-mu yang bisa masuk."],
  ["XyDesk Remote","Buka desktop dari HP lewat XyDesk dengan audio, mikrofon, dan AVC444."],
  ["Setup otomatis","Storage boost, debloat, dan dependensi Windows disiapkan oleh workflow."],
];
const steps=[
  ["01","Gunakan template","Pilih nama repository kamu sendiri."],
  ["02","Izinkan repo, lalu setup","Pilih repo untuk GitHub App, lalu siapkan jalur akses dan password Windows."],
  ["03","Hubungkan desktop","Jalankan workflow dan gunakan XyDesk Remote."],
];
export default function Home(){return <main className="landing"><Navigation publicMode/>
  <section className="hero hero-orbital"><div className="hero-copy"><span className="eyebrow"><T text="Dikembangkan oleh"/> {BRAND.developer}</span><h1><T text="RDP gratis,"/><br/><span><T text="6 jam penuh."/></span></h1><p><T text="Satu dashboard untuk menyiapkan Windows, menjalankan workflow GitHub, dan membuka desktop lewat XyDesk Remote."/></p><div className="actions"><Link href="/login" className="button github-cta"><GitHubIcon/><T text="Mulai dengan GitHub →"/></Link><a className="button secondary" href={repoUrl} target="_blank" rel="noreferrer"><T text="Lihat template ↗"/></a><a className="button secondary" href={BRAND.xydeskUrl} target="_blank" rel="noreferrer"><T text="Download XyDesk ↗"/></a></div><CommunityStats/><p className="muted"><T text="Workflow berjalan di akun GitHub kamu, mengikuti kuota dan kebijakan GitHub Actions."/></p></div><HeroVisual/></section>
  <section className="feature-grid" aria-label="Fitur">{features.map(([t,d])=><article key={t}><h3><T text={t}/></h3><p><T text={d}/></p></article>)}</section>
  <BrandSlider/><div id="panduan"><TutorialVideo {...tutorialVideo}/></div>
  <section className="landing-steps">{steps.map(([n,t,d])=><article key={n}><span>{n}</span><h2><T text={t}/></h2><p><T text={d}/></p></article>)}</section>
  <CommunitySupport/><footer>© {new Date().getFullYear()} {BRAND.name} · <T text="Dikembangkan oleh"/> {BRAND.developer}</footer></main>}
