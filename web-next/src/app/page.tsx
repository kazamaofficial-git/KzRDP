import {T} from "@/components/locale-provider";
import HeroVisual from "../components/landing/hero-visual";
import CommunityStats from "../components/landing/community-stats";
import GitHubIcon from "../components/landing/github-icon";
import Link from "next/link";
import Image from "next/image";
import Navigation from "../components/dashboard/navigation";
import CommunitySupport from "../components/landing/community-support";
import BrandSlider from "../components/landing/brand-slider";
import TutorialVideo from "../components/landing/tutorial-video";
import {tutorialVideo} from "@/lib/config/tutorial";
import {BRAND,repoUrl} from "@/lib/config/brand";
const icons={clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,shield:<><path d="M12 3 5 6v5c0 4.3 3 7.7 7 9 4-1.3 7-4.7 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,monitor:<><rect x="3" y="4" width="18" height="12" rx="2.5"/><path d="M8 20h8M12 16v4"/></>,wand:<><path d="m5 19 9-9"/><path d="m14 6 1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1ZM18 14l.7-1.4.7 1.4 1.4.7-1.4.7-.7 1.4-.7-1.4-1.4-.7 1.4-.7Z"/></>};
const features=[
  ["clock","6 jam penuh","Sesi Windows hingga 360 menit per run, termasuk waktu persiapan."],
  ["shield","Tailscale privat","Tanpa tunnel publik. Hanya perangkat di tailnet-mu yang bisa masuk."],
  ["monitor","XyDesk Remote","Buka desktop dari HP lewat XyDesk dengan audio, mikrofon, dan AVC444."],
  ["wand","Setup otomatis","Storage boost, debloat, dan dependensi Windows disiapkan oleh workflow."],
];
const steps=[
  ["01","Gunakan template","Pilih nama repository kamu sendiri."],
  ["02","Izinkan repo, lalu setup","Pilih repo untuk GitHub App, lalu siapkan jalur akses dan password Windows."],
  ["03","Hubungkan desktop","Jalankan workflow dan gunakan XyDesk Remote."],
];
export default function Home(){return <main className="landing"><Navigation publicMode/>
  <section className="hero hero-orbital"><div className="hero-copy"><span className="eyebrow"><T text="Dikembangkan oleh"/> {BRAND.developer}</span><h1><T text="RDP gratis,"/><br/><span><T text="6 jam penuh."/></span></h1><p><T text="Satu dashboard untuk menyiapkan Windows, menjalankan workflow GitHub, dan membuka desktop lewat XyDesk Remote."/></p><div className="actions"><Link href="/login" className="button github-cta"><GitHubIcon/><T text="Mulai dengan GitHub →"/></Link><a className="button secondary" href={repoUrl} target="_blank" rel="noreferrer"><T text="Lihat template ↗"/></a></div><CommunityStats/><p className="muted"><T text="Workflow berjalan di akun GitHub kamu, mengikuti kuota dan kebijakan GitHub Actions."/></p></div><HeroVisual/></section>
  <section className="feature-grid" aria-label="Fitur">{features.map(([i,t,d])=><article key={t}><span className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icons[i as keyof typeof icons]}</svg></span><h3><T text={t}/></h3><p><T text={d}/></p></article>)}</section>
  <BrandSlider/><div id="panduan"><TutorialVideo {...tutorialVideo}/></div>
  <section className="landing-steps">{steps.map(([n,t,d])=><article key={n}><span>{n}</span><h2><T text={t}/></h2><p><T text={d}/></p></article>)}</section>
  <CommunitySupport/>
  <section className="credit-banner" aria-label={BRAND.developer}><div className="credit-card"><Image src="/kazama-tech-white.webp" alt={BRAND.developer} width={1400} height={343} unoptimized/></div><p><T text="Dikembangkan oleh"/> <strong>{BRAND.developer}</strong></p></section>
  <footer>© {new Date().getFullYear()} {BRAND.name} · <T text="Dikembangkan oleh"/> {BRAND.developer}</footer></main>}
