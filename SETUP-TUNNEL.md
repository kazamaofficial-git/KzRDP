# SETUP TUNNEL — Domain Publik ke RDP (bore)

Mode `akses = tunnel` membuka RDP lewat domain milikmu tanpa tailnet. Alamat **hanya diketahui server dan DM Telegram pemilik token**: tidak ada di repo publik, log publik, atau file status.

Cara kerja: server bore berjalan di server pribadimu; runner menjalankan `bore local 3389 --to <domain> --port <port>`. Port dipilih acak oleh dashboard per sesi, rahasia bore dikirim ke runner hanya setelah token terverifikasi.

## 1. Jalankan server bore
Di server pribadi (buka rentang port di firewall, mis. 20000–29999, dan port kontrol 7835):

```bash
docker run -d --name bore --restart unless-stopped --network host \
  -e BORE_SECRET='ISI_RAHASIA_PANJANG' ekzhang/bore server --min-port 20000
```

Arahkan A record domain (mis. `tunnel.kazamasite.biz.id`) ke IP server (DNS only, bukan proxied).

## 2. Siapkan klien Windows
Unduh `bore-<versi>-x86_64-pc-windows-msvc.zip` dari rilis resmi [ekzhang/bore](https://github.com/ekzhang/bore/releases), hitung SHA256-nya sendiri (`certutil -hashfile berkas.zip SHA256`), dan simpan URL + hash-nya di Worker. Hash yang dipin server menjamin runner hanya menjalankan berkas yang kamu periksa.

## 3. Isi konfigurasi Worker
| Nama | Isi |
| --- | --- |
| `TUNNEL_HOST` | domain server bore |
| `TUNNEL_SECRET` (secret) | rahasia yang sama dengan server bore |
| `TUNNEL_BORE_URL` | URL https zip bore Windows |
| `TUNNEL_BORE_SHA256` | hash SHA256 zip tersebut |
| `TUNNEL_PORT_MIN` / `TUNNEL_PORT_MAX` | rentang port (default 20000–29999, harus cocok dengan firewall/server) |

Lalu jalankan workflow dengan `akses = tunnel`. Telegram menerima `host:port`, username, dan password.

## Risiko
RDP yang terbuka ke internet diserang tebakan password otomatis begitu alamatnya diketahui. Rahasiakan domain/port, jangan memakai password lemah (default-nya acak 22 karakter), dan hentikan sesi bila tidak dipakai.
