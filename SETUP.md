# SETUP — Menjalankan Workflow Sampai Sesi Online

Panduan ini membawa kamu dari repository kosong sampai bisa masuk ke desktop Windows lewat XyDesk. Tidak perlu dashboard web (itu ada di [`SETUP-WEB.md`](SETUP-WEB.md)). Penjelasan umum ada di [`README.md`](README.md).

**Yang dibutuhkan:** akun GitHub, akun Tailscale (gratis), HP/PC dengan Tailscale dan XyDesk.

---

## 1. Buat repository sendiri

1. Buka <https://github.com/kazamaofficial-git/KzRDP>.
2. Klik **Use this template → Create a new repository** (atau **Fork**). Nama bebas, mis. `KzRDP`.
3. Di repository barumu buka tab **Actions**. Jika muncul tombol *I understand my workflows, go ahead and enable them*, klik tombol itu.

## 2. Siapkan Tailscale

1. Daftar/masuk di <https://login.tailscale.com>.
2. Buka **Settings → Keys → Generate auth key**. Disarankan centang **Reusable** dan **Ephemeral** (perangkat sesi hilang otomatis dari daftar setelah selesai).
3. Salin key (berawalan `tskey-auth-...`). Key hanya tampil sekali.
4. Pastikan ACL tailnet mengizinkan **TCP 3389** ke perangkat sesi (default Tailscale sudah mengizinkan semua).
5. Pasang Tailscale di HP/PC yang akan dipakai, login ke **tailnet yang sama**.

## 3. Isi secret repository

Di repository: **Settings → Secrets and variables → Actions → New repository secret**.

| Nama | Isi | Wajib |
| --- | --- | --- |
| `RDP_PASSWORD` | Password login Windows, **minimal 8 karakter** | ✅ |
| `TAILSCALE_AUTH_KEY` | Auth key dari langkah 2 | ✅ (mode Tailscale) |
| `CLEANUP_TOKEN` | PAT dengan scope `repo`, untuk menghapus run lama otomatis | opsional |

Password tidak pernah dicetak di log. Simpan sendiri di password manager — secret GitHub tidak bisa dibaca lagi.

## 4. Jalankan workflow

1. Tab **Actions → KzRDP — RDP 6 Jam → Run workflow**.
2. Atur opsi (centang sesuai kebutuhan). Untuk pemakaian biasa **biarkan semua default**:
   - `durasi_menit` = 360 · `runner` = windows-2025 · `akses` = tailscale · `rdp_user` = kzadmin
   - ☑ `xydesk` ☑ `microphone` ☑ `samp` — aktif; opsi lain mati.
3. Klik **Run workflow**. Jika sudah ada sesi berjalan, run baru akan antre (satu sesi per repo).

## 5. Tunggu sampai selesai disiapkan

Klik run yang baru muncul dan pantau langkah-langkahnya. Urutan normalnya:

1. Checkout → Info lingkungan
2. Setup dasar (user admin + RDP 3389)
3. Pulihkan sesi sebelumnya
4. Host setup XyDesk Remote
5. Setup akses privat Tailscale
6. Wallpaper dan mikrofon · Publish koneksi
7. Opsi tambahan yang kamu centang · dependensi · *Tools dev opsional* (WinRAR, VC++, XAMPP; jika gagal sesi tetap lanjut)
8. **KONEKSI SIAP** — log menampilkan `Tailscale: 100.x.x.x:3389` dan `Username: kzadmin`
9. **SUDAH ONLINE — sesi aktif** ← sesi sudah bisa dipakai, langkah ini tetap berjalan sampai waktu habis

Catat **IP Tailscale** dan **username** dari langkah *KONEKSI SIAP*. Waktu persiapan (biasanya beberapa menit, lebih lama jika storage boost/ekstra dicentang) mengurangi sisa durasi sesi.

## 6. Hubungkan dari HP

1. Unduh **XyDesk** dari <https://rdp.xydesk.my.id/> dan pasang.
2. Buka Tailscale di HP, pastikan status **Connected**.
3. Di XyDesk tambah koneksi RDP baru (nama menu bisa berbeda antarversi): host = IP Tailscale tadi, port `3389`, user = `kzadmin`, password = isi `RDP_PASSWORD`.
4. Aktifkan input mikrofon/audio di XyDesk bila perlu (Android akan meminta izin).

## 7. Selesai dan mengulang

- Sesi berakhir sendiri saat durasi habis, atau hentikan manual lewat **Cancel workflow** di halaman run.
- Di akhir, workflow otomatis menyimpan folder pengguna (artifact `kzrdp-state`, 90 hari), mematikan akses Tailscale, dan membersihkan run lama.
- Untuk sesi berikutnya cukup **Run workflow** lagi; data sesi sebelumnya dipulihkan otomatis.

---

## Jika bermasalah

| Gejala | Penyebab umum | Perbaikan |
| --- | --- | --- |
| Gagal di *Setup dasar* dengan pesan password | `RDP_PASSWORD` kosong atau < 8 karakter | Isi ulang secret |
| Gagal di *Setup akses privat Tailscale* | `TAILSCALE_AUTH_KEY` salah/kedaluwarsa | Buat key baru, perbarui secret |
| Log menampilkan IP tapi tidak bisa tersambung | HP belum di tailnet yang sama / ACL memblokir 3389 | Login Tailscale yang sama, cek ACL |
| Run langsung gagal tanpa langkah | Actions belum diaktifkan di repo | Tab Actions → aktifkan workflow |
| Langkah *Tools dev* merah/kuning | Download XAMPP gagal atau installer error | Sesi tetap jalan. Matikan centang `devtools` bila tidak butuh XAMPP |
| Sesi terputus lebih cepat dari durasi | Batas job GitHub 360 menit termasuk setup | Kurangi opsi tambahan |
| Akun GitHub dibatasi | Pemakaian Actions di luar tujuan CI/CD | Tidak bisa dijamin aman; hubungi GitHub Support |
