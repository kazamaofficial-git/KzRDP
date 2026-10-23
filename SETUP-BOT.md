# SETUP BOT — Token RDP + Bot Telegram

Fitur ini opsional dan berjalan di dashboard (Cloudflare Worker). Alurnya:

1. Di dashboard menu **Token** → isi **email pemilik** (username GitHub-mu otomatis terikat) → *Buat token* (`RDP-XXXXXXXXXX`, tampil **sekali**).
2. Di **grup Telegram yang diizinkan** kirim `/verif RDP-XXXXXXXXXX`.
   - Jika kamu belum menekan **Start** di bot, bot meminta kamu Start dulu (token belum terverifikasi); setelah itu kirim `/verif` lagi.
   - Jika sudah, bot membalas di grup dan mengirim konfirmasi ke DM. Pesan `/verif` dihapus dari grup secepatnya.
3. Jalankan RDP lewat tombol **Mulai RDP** di dashboard (token dan email terisi otomatis), atau workflow **KzRDP — RDP 6 Jam** di GitHub dengan input `token`, `github`, dan `email` (ketiganya wajib). Server memverifikasi token, lalu mengirim **host, port, username, password** ke DM Telegram saat RDP siap.
4. Dashboard menampilkan status dan sisa waktu; bot punya `/start`, `/panduan`, `/status`.

**Gerbang build:** tanpa token yang sudah diverifikasi di Telegram, build ditolak. Token, **email**, dan **username GitHub** harus milik orang yang sama; salah satu berbeda → build ditolak (3 kali salah dalam 1 jam mengunci token itu sementara). Token yang bocor saja tidak cukup untuk menjalankan build.

Aturan token: tampil sekali; berlaku 30 menit untuk diverifikasi, lalu 60 menit untuk dipakai; tidak bisa dibuat saat ada RDP aktif atau token lama masih berlaku; setelah RDP selesai tunggu **1 jam** sebelum token baru.

## Pemasangan

1. **Tabel baru** — di D1 (Console atau `wrangler d1 execute --remote --file=bot-schema.sql`) jalankan isi `web-next/bot-schema.sql`.
2. **Buat bot** di [@BotFather](https://t.me/BotFather): `/newbot`. Simpan token bot. Opsional: `/setcommands` → `start`, `panduan`, `verif`, `status`.
3. **Masukkan ke grup** yang diizinkan dan jadikan **admin** dengan izin *Delete messages* (agar token dihapus dari grup). Dapatkan ID grup (diawali `-100...`), misalnya dengan menambahkan @RawDataBot sementara.
4. **Secret Worker** (`npx wrangler secret put NAMA` atau Variables and Secrets → tipe Secret):

   | Nama | Isi |
   | --- | --- |
   | `TELEGRAM_BOT_TOKEN` | token dari BotFather |
   | `TELEGRAM_WEBHOOK_SECRET` | teks acak panjang buatanmu (huruf/angka/`_`/`-`) |
   | `TELEGRAM_ALLOWED_CHATS` | ID grup, pisahkan koma bila lebih dari satu |
   | `TELEGRAM_BOT_USERNAME` | username bot tanpa `@` (untuk pesan "Start bot") |

5. **Pasang webhook** (sekali, dari browser atau terminal; ganti nilai):

   ```
   https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://rdp.kazamasite.biz.id/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>&allowed_updates=["message"]
   ```

6. **Variabel repo (opsional)** — di repo pengguna *Settings → Secrets and variables → Actions → Variables*: `KZRDP_API` = URL dashboard (default `https://rdp.kazamasite.biz.id`).

## Catatan keamanan dan batas

- Siapa yang pertama mengirim `/verif` menerima data RDP di DM-nya. Token yang bocor tetap tidak bisa menjalankan build tanpa email dan username GitHub pemilik, tetapi jika orang lain memverifikasinya lebih dulu, DM berisi data RDP akan ke dia. Token dihapus dari grup segera; untuk risiko lebih rendah, verifikasi di chat pribadi dan biarkan bot memeriksa keanggotaan grup lewat `getChatMember` (belum diterapkan).
- Password RDP dikirim lewat server dashboard ke Telegram; server tidak menyimpannya. Token tidak bisa disembunyikan dari log GitHub karena input workflow tampil di halaman run, tapi token hanya berlaku sekali dan dikunci begitu build dimulai.
- **Gerbang tidak bisa dilewati dengan mengedit workflow:** skrip build tidak ada di repo pengguna, melainkan diunduh dari server setelah verifikasi. Menghapus langkah verifikasi berarti tidak ada skrip yang tersisa untuk dijalankan.
- Email dan username GitHub adalah penanda kepemilikan token (email tidak diverifikasi lewat surel); keamanan utamanya ada pada token yang diverifikasi akun Telegram.
