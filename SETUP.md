# SETUP — Menjalankan RDP dari Workflow

Panduan ini untuk **pengguna**. Pemasangan server ada di [`SETUP-WEB.md`](SETUP-WEB.md) dan bot di [`SETUP-BOT.md`](SETUP-BOT.md).

## 1. Buat repository dari template
Buka repo template (`kazamaofficial-git/KzRDP`) → **Use this template → Create a new repository** → di tab **Actions** aktifkan workflow bila diminta. Repo itu hanya berisi satu workflow; tidak ada skrip di dalamnya.

## 2. (Opsional) secret
Settings → Secrets and variables → Actions:

| Nama | Isi |
| --- | --- |
| `RDP_PASSWORD` | Password tetap (≥ 8 karakter). **Kosong = dibuat acak** dan dikirim ke Telegram |
| `TAILSCALE_AUTH_KEY` | Hanya untuk `akses = tailscale` (`tskey-auth-...`) |
| `PORTMAP_OVPN_CONFIG` | Hanya untuk `akses = portmap` |

Variabel `KZRDP_API` hanya perlu diisi bila alamat server berbeda dari bawaan.

## 3. Siapkan token
Dashboard → **Token** → isi email pemilik → *Buat token* (tampil sekali). Di grup Telegram yang diizinkan kirim `/verif RDP-XXXXXXXXXX`. Jika bot belum di-Start, ia meminta kamu Start dulu lalu kirim `/verif` lagi.

## 4. Jalankan
**Actions → KzRDP — RDP 6 Jam → Run workflow**, isi:

- `token`, `github` (username GitHub pemilik token), `email` pemilik token — **harus cocok semuanya**
- `rdp_user`, `runner` (`windows-2025` / `windows-2022`), `durasi_menit` (10–360)
- `akses` (`tailscale` / `tunnel` / `portmap`) dan checkbox opsi

Alternatif: tombol **Mulai RDP** di dashboard mengisi token, email, dan GitHub otomatis.

## 5. Tahapan di log
`1 Verifikasi` → `2 Siapkan sistem` → `3 Kirim data` → `4 Opsi tambahan` → `5 Sesi aktif` → `6 Simpan sesi` → `Selesai`. Tiap tahap dilipat dalam grup; ringkasannya ada di tab **Summary** run. Pada tahap 3, log menampilkan banner **KONEKSI SIAP** dan link unduh XyDesk (hanya selama sesi).

## 6. Terhubung
Alamat, username, dan password dikirim ke **DM Telegram**-mu (di repo publik alamat tidak ditulis di log). Buka XyDesk Remote dan masukkan datanya. Untuk `tailscale`, HP harus berada di tailnet yang sama; `tunnel` dan `portmap` bisa dari mana saja.

## Jika bermasalah
| Gejala | Penyebab umum |
| --- | --- |
| Langkah 1 ditolak: "Email atau username GitHub tidak sesuai" | Salah satu dari token/email/github bukan milik pemilik token (3× salah = terkunci 1 jam) |
| "Token belum diverifikasi" | Belum `/verif` di grup, atau bot belum di-Start |
| "Durasi harus angka 10–360" | Isi `durasi_menit` dengan angka dalam rentang itu |
| "Tunnel belum dikonfigurasi di server" | Admin belum mengisi `TUNNEL_*` ([`SETUP-TUNNEL.md`](SETUP-TUNNEL.md)) |
| Langkah *Opsi tambahan* kuning | Opsi opsional gagal; sesi tetap jalan |
