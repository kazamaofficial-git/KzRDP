// Satu-satunya tempat untuk mengatur identitas KzRDP.
// Ubah nilai di bawah ini sesuai domain, repository, dan kanal milik Kazama Tech.
export const BRAND = {
  name: "KzRDP",
  developer: "Kazama Tech",
  tagline: "RDP gratis 6 jam, langsung dari GitHub Actions.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://rdp.kazamasite.biz.id",
  templateRepo: "kazamaofficial-git/KzRDP",
  xydeskUrl: "https://rdp.xydesk.my.id/",
  // Kosongkan array agar bagian terkait otomatis disembunyikan di landing page.
  community: [
    // {label:"Saluran Telegram", description:"Update dan pengumuman KzRDP.", url:"https://t.me/..."},
  ] as {label:string;description:string;url:string}[],
  support: [
    // {label:"Saweria", description:"Dukung pengembangan KzRDP.", url:"https://saweria.co/..."},
  ] as {label:string;description:string;url:string}[],
} as const;
export const SITE_ORIGIN = new URL(BRAND.siteUrl).origin;
export const SITE_HOST = new URL(BRAND.siteUrl).hostname;
export const repoUrl = `https://github.com/${BRAND.templateRepo}`;
