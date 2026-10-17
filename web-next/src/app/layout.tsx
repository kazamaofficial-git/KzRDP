import type {Metadata,Viewport} from "next";
import "./globals.css";
import "./theme.css";
import {headers,cookies} from "next/headers";
import LocaleProvider,{LanguageSwitcher} from "./locale-provider";
import {preferredLocale} from "@/lib/i18n/locale";
import {BRAND} from "@/lib/brand";
const title=`${BRAND.name} — Desktop Windows 6 jam, gratis`;
const description=`Siapkan sesi Windows lewat GitHub Actions, hubungkan dengan Tailscale privat, lalu buka dari XyDesk Remote. Dikembangkan oleh ${BRAND.developer}.`;
export const viewport:Viewport={themeColor:"#07050b",colorScheme:"dark"};
export const metadata:Metadata={icons:{icon:[{url:"/favicon.svg",type:"image/svg+xml"},{url:"/favicon.ico",sizes:"any"}],apple:"/apple-touch-icon.png"},metadataBase:new URL(BRAND.siteUrl),title:{default:title,template:`%s · ${BRAND.name}`},description,authors:[{name:BRAND.developer}],openGraph:{type:"website",locale:"id_ID",siteName:BRAND.name,title,description,url:BRAND.siteUrl,images:[{url:"/og-kzrdp.jpg?v=3",width:1200,height:630,alt:`${BRAND.name} — RDP gratis 6 jam`}]},twitter:{card:"summary_large_image",title,images:["/og-kzrdp.jpg?v=3"]}};
export default async function Layout({children}:{children:React.ReactNode}){
  const lang=preferredLocale((await cookies()).get("kzrdp_locale")?.value,(await headers()).get("accept-language"));
  return <html lang={lang}><body><LocaleProvider initialLocale={lang}>{children}<div className="global-language"><LanguageSwitcher/></div></LocaleProvider></body></html>
}
