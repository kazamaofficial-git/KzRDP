<div align="center">

# KzRDP

**Desktop Windows 6 jam, gratis — lewat GitHub Actions + Tailscale privat, dibuka dengan XyDesk Remote.**

Dikembangkan oleh **Kazama Tech**

</div>

---

## Cara kerja

1. Login identitas GitHub di `/login` (scope `read:user`, tanpa akses repository).
2. Buat repository dari template, lalu pasang **GitHub App** di `/dashboard/connection` dan pilih repo yang diizinkan.
3. Isi `RDP_PASSWORD` dan `TAILSCALE_AUTH_KEY` di halaman **Setup**. Hubungkan HP ke tailnet yang sama.
4. Atur sesi di **Settings**, jalankan dari **Home**, lalu sambungkan lewat **XyDesk Remote**.

Username RDP bawaan: `kzadmin` (`runneradmin` hanya bila dipilih eksplisit). Durasi job maksimal 360 menit termasuk setup. Workflow mengubah kebijakan Windows (termasuk UAC dan akun administrator), jadi gunakan mesin khusus/disposable, **bukan komputer kerja utama**.

> Workflow berjalan di akun GitHub pengguna dan mengikuti kuota serta kebijakan GitHub Actions. Penggunaan Actions di luar tujuan CI/CD dapat berisiko ditangguhkan oleh GitHub.

## Struktur repository

```
.github/workflows/   rdp-6h.yml (sesi Windows) + workflow validasi
scripts/             skrip PowerShell persiapan host (RDP, Tailscale, XyDesk, games, media)
assets/              wallpaper dan konfigurasi (rdp-extras.json)
web-next/            dashboard Next.js / OpenNext / Cloudflare
  src/lib/brand.ts   <- identitas, domain, repo template, tautan komunitas & dukungan
  src/app/theme.css  <- tema hitam + ungu
docs/                dokumentasi host Windows
integrasi-xydesk/    paket integrasi untuk aplikasi XyDesk Remote
```

## Yang harus kamu isi sebelum deploy

| Berkas | Isi |
| --- | --- |
| `web-next/src/lib/brand.ts` | `siteUrl`, `templateRepo`, daftar `community` dan `support` (kosong = bagian disembunyikan) |
| `web-next/wrangler.jsonc` | `account_id`, domain `routes`, dan `database_id` D1 milikmu |
| `web-next/schema.sql` | jalankan ke database D1 baru |
| Environment dashboard | `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, kredensial OAuth GitHub, kredensial admin |

## Pengembangan

```bash
cd web-next
npm install
npm run dev            # http://localhost:3000
npm run lint && npx tsc --noEmit
npm run build:worker   # build OpenNext untuk Cloudflare
```

Panduan lanjutan ada di `web-next/README.md`, `web-next/docs/`, dan `docs/`.

## Integrasi XyDesk

Native API dan format token dijelaskan di `web-next/docs/XYDESK-API.md`. Paket tempel untuk aplikasi ada di `integrasi-xydesk/`.

---

© KzRDP · Kazama Tech
