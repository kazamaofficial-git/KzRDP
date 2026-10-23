# KzRDP

Desktop Windows sementara di GitHub Actions, dibuka dengan XyDesk Remote. Dikembangkan oleh **Kazama Tech**.

Repository ini hanya berisi satu workflow tipis (`.github/workflows/rdp-6h.yml`). Seluruh skrip build **tidak ada di sini**: workflow mengunduhnya dari server KzRDP setelah **token, email, dan username GitHub** terverifikasi. Tanpa verifikasi tidak ada yang berjalan.

## Memakai

1. Buat token di dashboard, lalu verifikasi di grup Telegram (`/verif RDP-XXXXXXXXXX`).
2. Jalankan **Actions → KzRDP — RDP 6 Jam → Run workflow** dan isi:
   - `token`, `email` pemilik token, dan `github` (username GitHub pemilik token)
   - `rdp_user` (username Windows), `runner` (`windows-2025` atau `windows-2022`), `durasi_menit` (10–360)
3. Data RDP (alamat, username, password) dikirim ke DM Telegram-mu. Password dibuat acak bila secret `RDP_PASSWORD` kosong.

Secret opsional: `RDP_PASSWORD` (password tetap), `TAILSCALE_AUTH_KEY` (akses Tailscale). Variabel opsional: `KZRDP_API` (alamat server bila berbeda dari bawaan).

© KzRDP · Kazama Tech
