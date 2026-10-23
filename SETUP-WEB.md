# SETUP WEB — Memasang Dashboard KzRDP

Dashboard (`web-next/`) adalah panel Next.js 15 yang berjalan di **Cloudflare Workers + D1**. Fungsinya: login GitHub, memilih repository, mengisi secret, mengatur opsi sesi (dengan checkbox), menjalankan/menghentikan workflow, melihat log, dan membuat token untuk XyDesk.

Ini **opsional** — untuk memakai KzRDP tanpa dashboard cukup ikuti [`SETUP.md`](SETUP.md). Penjelasan umum ada di [`README.md`](README.md).

**Yang dibutuhkan:** Node.js 22+, akun Cloudflare (Workers + D1), sebuah domain di Cloudflare, akun GitHub, dan akun Cloudflare Turnstile.

---

## 1. Siapkan identitas

Semua identitas ada di **`web-next/src/lib/config/brand.ts`**:

| Field | Isi |
| --- | --- |
| `siteUrl` | URL dashboard, mis. `https://kzrdp.domainmu.com` (atau set env `NEXT_PUBLIC_SITE_URL` saat build) |
| `templateRepo` | `kazamaofficial-git/KzRDP` (repo template yang dipakai saat membuat repo pengguna) |
| `xydeskUrl` | link unduh XyDesk; hanya ditampilkan selama sesi berjalan (dashboard, Telegram, log workflow) |
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
npx wrangler d1 execute kzrdp-state --remote --file=bot-schema.sql   # fitur token (lihat SETUP-BOT.md)
```

## 4. Buat OAuth App GitHub (untuk login)

GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**

- Homepage URL: `https://DOMAINMU`
- Authorization callback URL: `https://DOMAINMU/api/auth/callback/github`

Simpan **Client ID** (`GITHUB_ID`) dan **Client Secret** (`GITHUB_SECRET`). Login hanya meminta scope `read:user`; akses repository diberikan terpisah lewat GitHub App (langkah 7).

## 5. Buat Turnstile (login admin)

Cloudflare → **Turnstile → Add widget**. Batasi ke hostname dashboard, simpan **Site Key** dan **Secret Key**. Aksi widget yang dipakai: `admin_login`.

## 6. Isi secret Worker

`NEXTAUTH_URL` tidak perlu diisi: alamat situs diambil dari `siteUrl` di `web-next/src/lib/config/brand.ts`. Jika kamu sempat membuatnya di dashboard Cloudflare, hapus saja.

Buat nilai berikut lalu simpan satu per satu dengan `npx wrangler secret put NAMA`:

| Secret | Isi |
| --- | --- |
| `NEXTAUTH_SECRET` | acak panjang: `openssl rand -base64 32` (jangan diganti-ganti, mengenkripsi sesi) |
| `GITHUB_ID`, `GITHUB_SECRET` | dari langkah 4 |
| `ADMIN_EMAIL` | email login admin |
| `ADMIN_PASSWORD_HASH` | format `salt:hash` (PBKDF2-SHA256, 100.000 putaran), buat dengan perintah di bawah |
| `ADMIN_CREDENTIAL_VERSION` | teks bebas; ganti nilainya untuk mencabut semua sesi admin |
| `ADMIN_REPO` | `pemilik/repo` yang dikelola admin |
| `ADMIN_GITHUB_TOKEN` | PAT GitHub untuk repo admin |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | dari langkah 5 |
| `TUNNEL_*` (opsional) | untuk `akses = tunnel`, lihat [`SETUP-TUNNEL.md`](SETUP-TUNNEL.md) |

Membuat `ADMIN_PASSWORD_HASH` (jalankan dari folder `web-next`; berlaku di Windows, macOS, Linux, dan Termux):

```bash
node tools/admin-hash.mjs          # tanya password, lalu cetak hash
node tools/admin-hash.mjs --check  # periksa: hash yang kamu simpan cocok dengan passwordmu?
```

Jika login admin gagal, lihat alasannya dengan `npx wrangler tail` lalu coba login lagi; setiap penolakan dicatat dengan alasan (secret belum diisi, Turnstile, password/email salah, atau terlalu banyak percobaan). Batas percobaan: 5 kali per 15 menit per IP.

Tanpa terminal: tambahkan variabel **Text** `ADMIN_LOGIN_DEBUG` = `1` di Worker (Settings → Variables and Secrets), lalu coba login; alasan penolakan akan tampil di halaman login. **Hapus variabel itu setelah selesai** (alasannya membedakan email/password salah).

## 7. Build dan deploy

```bash
npm run lint && npx tsc --noEmit
npm run build:worker
npm run deploy
```

Buka `https://DOMAINMU`. Halaman admin tersembunyi ada di `/admin/login`.

## 8. Siapkan repo template dan GitHub App

**a. Repo template (publik).** Isi repo `kazamaofficial-git/KzRDP` adalah **isi folder `template/`** proyek ini (hanya `.github/workflows/rdp-6h.yml` + README). Jadikan **template**: Settings → centang "Template repository". Skrip build tidak ikut: itu ada di `web-next/bundle/` dan disajikan server (lihat bagian *Paket build*).

**b. Daftarkan GitHub App (sekali saja, oleh admin).** Selama ini belum dilakukan, tombol **"Izinkan akses repository"** di dashboard pengguna sengaja nonaktif (tampil redup). Urutannya:

1. Login admin di `/admin/login`.
2. Buka `/admin/github-app`, lalu tekan **Daftarkan GitHub App**.
3. Di halaman GitHub yang terbuka, pastikan kamu login ke akun pemilik app, setujui nama app, dan tekan buat. GitHub mengembalikan kamu ke dashboard; halaman admin sekarang berbunyi **"GitHub App aktif"**.
4. Pengguna lalu bisa login GitHub di `/login`, memakai tombol **Izinkan akses repository**, dan memilih repo mereka.

Jangan mengganti `NEXTAUTH_SECRET` setelah GitHub App didaftarkan: konfigurasi App di database dienkripsi dengan kunci turunan dari secret itu, dan akan tidak terbaca jika diganti.

**c. Admin memakai dashboard sendiri.** Halaman dashboard untuk akun admin membaca repo dari secret `ADMIN_REPO` dan `ADMIN_GITHUB_TOKEN`. Jika keduanya kosong, halaman seperti Games atau Settings akan tampak kosong atau menampilkan error.

**Catatan halaman terkunci:** akun pengguna biasa yang belum memilih repo akan melihat panduan setup yang sama di semua halaman dashboard. Itu disengaja; halaman lain terbuka setelah langkah 3 (pilih repo) selesai.

**d. QRIS donasi.** Gambar ditampilkan dari `qrisUrl` di `brand.ts` dan domainnya sudah diizinkan di `next.config.ts` (`img-src`). Jika gambar tidak muncul, salin ke `web-next/public/qris.jpg` dan isi `qrisUrl` dengan `"/qris.jpg"`.

## 9. Alur pengguna di dashboard

1. **Login** GitHub di `/login`.
2. **Hubungkan** — buat repo dari template, pasang GitHub App, pilih repo.
3. **Setup** — isi `RDP_PASSWORD` dan `TAILSCALE_AUTH_KEY` (dikirim terenkripsi ke GitHub Secrets).
4. **Settings** — atur durasi, jalur akses, image Windows, dan **checkbox** opsi sesi.
5. **Home** — jalankan sesi; status, countdown, dan log tampil di dashboard.
6. **XyDesk** — buat token perangkat lalu tempel di aplikasi XyDesk; link unduh aplikasi muncul saat sesi berjalan. Kontrak API: [`web-next/docs/XYDESK-API.md`](web-next/docs/XYDESK-API.md).

Dashboard mengirim opsi checkbox ke workflow sebagai `true`/`false`. Repository pengguna harus memakai workflow **schema 6** (`# kzrdp-workflow-schema: 6`); dashboard menolak workflow lama dan menampilkan tombol sinkronisasi.

## Paket build (skrip di server, bukan di repo publik)

`web-next/bundle/` berisi seluruh skrip PowerShell dan aset sesi. `npm run build` / `npm run dev` menjalankan `tools/embed-bundle.mjs` otomatis (atau `npm run embed`), yang mengemasnya ke `src/generated/rdp-bundle.json` di dalam Worker. Endpoint `POST /api/v1/rdp/bundle` mengirimnya **hanya** ke sesi yang tokennya sudah diverifikasi (token + email + username GitHub cocok). Mengubah skrip = `npm run build:worker` lalu `npm run deploy`; repo pengguna tidak perlu disinkronkan lagi.

Setelah kamu memindahkan `web-next/` ke server pribadi, repo publik cukup berisi folder `template/`. Variabel `KZRDP_API` di repo pengguna (atau bawaan di workflow) harus menunjuk ke domain server barumu.

## Pengembangan lokal

```bash
cd web-next
npm ci
npm run dev        # http://localhost:3000 (membangun ulang bundle otomatis)
npm test           # jika skrip test tersedia; tes ada di web-next/tests
```

## Pemecahan masalah

| Gejala | Perbaikan |
| --- | --- |
| `Origin tidak diizinkan` saat menekan tombol | `siteUrl` di `brand.ts` harus sama dengan domain yang dibuka |
| Login admin gagal | Jalankan `npx wrangler tail` dan baca alasan `[admin-login] ditolak`. Pastikan empat secret admin terisi, hostname Turnstile = domain, dan hash cocok (`node tools/admin-hash.mjs --check`) |
| Dashboard bilang workflow belum sinkron | Salin `.github/workflows/rdp-6h.yml`, `scripts/`, `assets/` terbaru ke repo pengguna |
| Deploy gagal soal `account_id`/`database_id` | Isi nilai asli di `wrangler.jsonc` (langkah 3) |
