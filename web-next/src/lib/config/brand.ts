// Satu-satunya tempat untuk mengatur identitas KzRDP.
// Ubah nilai di bawah ini sesuai domain, repository, dan kanal milik Kazama Tech.
export const BRAND = {
  name: "KzRDP",
  developer: "Kazama Tech",
  tagline: "RDP gratis 6 jam, langsung dari GitHub Actions.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://rdp.kazamasite.biz.id",
  templateRepo: "kazamaofficial-git/KzRDP",
  xydeskUrl: "https://rdp.xydesk.my.id/",
  // Kontak bantuan (Telegram dan email). Kosongkan array agar bagian "Bantuan" disembunyikan.
  contacts: [
    {label:"Telegram",description:"@DhilzzKZ",url:"https://t.me/DhilzzKZ"},
    {label:"Email",description:"support@kazamasite.biz.id",url:"mailto:support@kazamasite.biz.id"},
  ] as {label:string;description:string;url:string}[],
  // Donasi hanya lewat QRIS, gambarnya ditampilkan langsung di halaman. Kosongkan "" untuk menyembunyikan.
  // Jika gambar tidak tampil, salin ke web-next/public/qris.jpg lalu isi dengan "/qris.jpg".
  qrisUrl: "https://www.kazamasite.biz.id/images/qris.jpg",
} as const;
export const SITE_ORIGIN = new URL(BRAND.siteUrl).origin;
export const SITE_HOST = new URL(BRAND.siteUrl).hostname;
export const repoUrl = `https://github.com/${BRAND.templateRepo}`;
