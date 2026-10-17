# SETUP WEB — Memasang Dashboard KzRDP

Dashboard (`web-next/`) adalah panel Next.js 15 yang berjalan di **Cloudflare Workers + D1**. Fungsinya: login GitHub, memilih repository, mengisi secret, mengatur opsi sesi (dengan checkbox), menjalankan/menghentikan workflow, melihat log, dan membuat token untuk XyDesk.

Ini **opsional** — untuk memakai KzRDP tanpa dashboard cukup ikuti [`SETUP.md`](SETUP.md). Penjelasan umum ada di [`README.md`](README.md).

**Yang dibutuhkan:** Node.js 22+, akun Cloudflare (Workers + D1), sebuah domain di Cloudflare, akun GitHub, dan akun Cloudflare Turnstile.

---

## 1. Siapkan identitas

Semua identitas ada di **`web-next/src/lib/brand.ts`**:

| Field | Isi |
| --- | --- |
| `siteUrl` | URL dashboard, mis. `https://kzrdp.domainmu.com` (atau set env `NEXT_PUBLIC_SITE_URL` saat build) |
| `templateRepo` | `kazamaofficial-git/KzRDP` (repo template yang dipakai saat membuat repo pengguna) |
| `xydeskUrl` | `https://rdp.xydesk.my.id/` (link download XyDesk) |
| `community`, `support` | Daftar tautan komunitas/donasi. Kosongkan `[]` agar bagian itu disembunyikan |

Domain yang sama harus dipakai di `web-next/wrangler.jsonc` (`routes[].pattern`).

## 2. Pasang dependensi

```bash
cd web-next
npm ci
npx wrangler login
```

## 3. Buat database D1

```bash
npx wrangler d1 create kzrdp-state
```

Salin `database_id` yang muncul ke `wrangler.jsonc` (`d1_databases[0].database_id`), dan isi juga `account_id` Cloudflare kamu. Lalu buat tabel:

```bash
npx wrangler d1 execute kzrdp-state --remote --file=schema.sql
npx wrangler d1 execute kzrdp-state --remote --file=community-schema.sql
```

## 4. Buat OAuth App GitHub (untuk login)

GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**

- Homepage URL: `https://DOMAINMU`
- Authorization callback URL: `https://DOMAINMU/api/auth/callback/github`

Simpan **Client ID** (`GITHUB_ID`) dan **Client Secret** (`GITHUB_SECRET`). Login hanya meminta scope `read:user`; akses repository diberikan terpisah lewat GitHub App (langkah 7).

## 5. Buat Turnstile (login admin)

Cloudflare → **Turnstile → Add widget**. Batasi ke hostname dashboard, simpan **Site Key** dan **Secret Key**. Aksi widget yang dipakai: `admin_login`.

## 6. Isi secret Worker

Buat nilai berikut lalu simpan satu per satu dengan `npx wrangler secret put NAMA`:

| Secret | Isi |
| --- | --- |
| `NEXTAUTH_URL` | `https://DOMAINMU` |
| `NEXTAUTH_SECRET` | acak panjang: `openssl rand -base64 32` (jangan diganti-ganti, mengenkripsi sesi) |
| `GITHUB_ID`, `GITHUB_SECRET` | dari langkah 4 |
| `ADMIN_EMAIL` | email login admin |
| `ADMIN_PASSWORD_HASH` | format `salt:hash` (PBKDF2-SHA256, 100.000 putaran), buat dengan perintah di bawah |
| `ADMIN_CREDENTIAL_VERSION` | teks bebas; ganti nilainya untuk mencabut semua sesi admin |
| `ADMIN_REPO` | `pemilik/repo` yang dikelola admin |
| `ADMIN_GITHUB_TOKEN` | PAT GitHub untuk repo admin |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | dari langkah 5 |

Membuat `ADMIN_PASSWORD_HASH`:

```bash
node -e "const c=require('crypto');const s=c.randomBytes(16).toString('hex');console.log(s+':'+c.pbkdf2Sync(process.argv[1],s,100000,32,'sha256').toString('hex'))" 'PASSWORD_ADMIN_PANJANG'
```

## 7. Build dan deploy

```bash
npm run lint && npx tsc --noEmit
npm run build:worker
npm run deploy
```

Buka `https://DOMAINMU`. Halaman admin tersembunyi ada di `/admin/login`.

## 8. Daftarkan GitHub App (sekali saja)

1. Login ke `/admin/login`, buka `/admin/github-app`, lalu daftarkan App lewat tombol yang tersedia (memakai manifest otomatis).
2. Pengguna lalu login GitHub di `/login`, buka `/dashboard/connection`, dan memasang App pada repository yang dipilih.

## 9. Alur pengguna di dashboard

1. **Login** GitHub di `/login`.
2. **Hubungkan** — buat repo dari template, pasang GitHub App, pilih repo.
3. **Setup** — isi `RDP_PASSWORD` dan `TAILSCALE_AUTH_KEY` (dikirim terenkripsi ke GitHub Secrets).
4. **Settings** — atur durasi, jalur akses, image Windows, dan **checkbox** opsi sesi.
5. **Home** — jalankan sesi; status, countdown, dan log tampil di dashboard.
6. **XyDesk** — buat token perangkat, unduh XyDesk dari <https://rdp.xydesk.my.id/>, tempel token. Kontrak API: [`web-next/docs/XYDESK-API.md`](web-next/docs/XYDESK-API.md).

Dashboard mengirim opsi checkbox ke workflow sebagai `true`/`false`. Repository pengguna harus memakai workflow **schema 6** (`# kzrdp-workflow-schema: 6`); dashboard menolak workflow lama dan menampilkan tombol sinkronisasi.

## Pengembangan lokal

```bash
cd web-next
npm ci
npm run dev        # http://localhost:3000
npm test           # jika skrip test tersedia; tes ada di web-next/tests
```

## Pemecahan masalah

| Gejala | Perbaikan |
| --- | --- |
| `Origin tidak diizinkan` saat menekan tombol | `siteUrl` di `brand.ts` harus sama dengan domain yang dibuka |
| Login admin selalu gagal | Hostname Turnstile harus sama dengan domain; cek `ADMIN_PASSWORD_HASH` dan `ADMIN_EMAIL` |
| Dashboard bilang workflow belum sinkron | Salin `.github/workflows/rdp-6h.yml`, `scripts/`, `assets/` terbaru ke repo pengguna |
| Deploy gagal soal `account_id`/`database_id` | Isi nilai asli di `wrangler.jsonc` (langkah 3) |
