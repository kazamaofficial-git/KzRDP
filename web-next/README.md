# KzRDP Dashboard (web-next)

Next.js 15 + NextAuth 4 + OpenNext untuk Cloudflare Workers dan D1. Node 22+.

Panduan pemasangan lengkap: [`../SETUP-WEB.md`](../SETUP-WEB.md). Penjelasan proyek: [`../README.md`](../README.md).

## Ringkas

- Login publik GitHub (`read:user`) dan login admin terpisah (email/password + Turnstile). Otorisasi ditegakkan di server, bukan dengan menyembunyikan URL.
- Akses repository lewat GitHub App yang dipilih per repository; token login tidak dipakai sebagai kredensial repo.
- Dashboard: status workflow, countdown, start/stop dengan konfirmasi, pengaturan per repo (D1) dengan checkbox untuk opsi on/off, penjelajah folder, log job/step.
- Secret `RDP_PASSWORD` dan `TAILSCALE_AUTH_KEY` dikirim terenkripsi (sealed box) ke GitHub Secrets; dashboard tidak bisa membaca balik nilainya.
- Token perangkat 30 hari yang bisa dicabut untuk XyDesk — lihat [`docs/XYDESK-API.md`](docs/XYDESK-API.md).
- Kontrak workflow: dashboard hanya menjalankan workflow bertanda `# kzrdp-workflow-schema: 6` dan mengirim input boolean sebagai `"true"`/`"false"`.

## Konfigurasi

Identitas, domain, repo template, dan link XyDesk: `src/lib/config/brand.ts`. Tema: `src/app/theme.css` (menimpa `globals.css`). Binding Cloudflare: `wrangler.jsonc` (isi `account_id`, domain, `database_id`). Skema D1: `schema.sql`, `community-schema.sql`.

## Perintah

```bash
npm ci
npm run dev
npm run lint
npm run build:worker
npm run deploy
```

## Batasan

Tes otomatis memakai mock GitHub/D1 dan tidak menjalankan runner sungguhan. Pengujian akhir (login Turnstile manusia, sesi RDP penuh, koneksi XyDesk di perangkat) perlu dilakukan manual. Proyek ini tidak menjamin akun GitHub terhindar dari pembatasan.

Credit: Kazama Tech.
