<div align="center">

# KzRDP

**Desktop Windows 6 jam, gratis — lewat GitHub Actions + Tailscale privat, dibuka dengan XyDesk Remote.**

Dikembangkan oleh **Kazama Tech** · [github.com/kazamaofficial-git/KzRDP](https://github.com/kazamaofficial-git/KzRDP)

</div>

---

> **Mau langsung pakai?** Baca [`SETUP.md`](SETUP.md) (menjalankan workflow sampai sesi online).
> **Mau memasang dashboard web?** Baca [`SETUP-WEB.md`](SETUP-WEB.md).
> File ini hanya penjelasan: apa itu KzRDP, bagaimana cara kerjanya, dan isi repository.

## Apa itu KzRDP?

KzRDP menyiapkan mesin Windows sementara di **GitHub Actions** (runner hosted milik GitHub), mengaktifkan Remote Desktop, lalu menghubungkannya ke HP/PC kamu lewat **Tailscale** (jaringan privat, tanpa tunnel publik). Sesi bisa berjalan hingga **360 menit (6 jam)** per run, dan dibuka dengan aplikasi **XyDesk Remote** — unduh di <https://rdp.xydesk.my.id/>.

Ada dua cara memakainya:

| Cara | Untuk siapa | Dokumen |
| --- | --- | --- |
| **Workflow langsung** | Kamu cukup fork/template repo ini, isi 2 secret, lalu klik *Run workflow* | [`SETUP.md`](SETUP.md) |
| **Dashboard web** | Pasang panel Next.js + Cloudflare untuk mengatur dan menjalankan sesi dari browser/XyDesk | [`SETUP-WEB.md`](SETUP-WEB.md) |

## Cara kerja singkat

```
Run workflow ──► Runner Windows (GitHub) ──► buat user RDP ──► Tailscale up
                                                   │                │
                                         setup XyDesk host     IP 100.x.x.x:3389
                                                   │                │
                                             sesi online  ◄── XyDesk / klien RDP
                                                   │
                              selesai / timeout ──► simpan state, matikan akses, bersihkan run lama
```

Hanya ada **satu workflow**: `.github/workflows/rdp-6h.yml` (*KzRDP — RDP 6 Jam*).

## Opsi workflow

Opsi berupa **checkbox** (tipe `boolean`) di form *Run workflow* GitHub, kecuali yang berupa pilihan atau teks.

| Opsi | Tipe | Default | Fungsi |
| --- | --- | --- | --- |
| `durasi_menit` | pilihan | 360 | Durasi sesi (15–360 menit), termasuk waktu setup |
| `hostname` | teks | `kzrdp` | Nama perangkat di Tailscale (ditambah nomor run) |
| `rdp_user` | teks | `kzadmin` | Username login RDP |
| `akses` | pilihan | `tailscale` | `tailscale` (privat) atau `portmap` (publik, opsional) |
| `runner` | pilihan | `windows-2025` | Image Windows GitHub-hosted (`windows-2025`, `windows-latest`, `windows-2022`) |
| `xydesk` | ☑ | aktif | Setup host XyDesk (AVC444, ClearType, audio/mic, UDP 4433) |
| `microphone` | ☑ | aktif | Izinkan input mikrofon lewat RDP |
| `samp` | ☑ | aktif | Dependensi DirectX legacy, Visual C++, DirectPlay/.NET |
| `storage_boost` | ☑ | mati | Bebaskan 45–75 GB dengan menghapus paket besar bawaan runner |
| `debloat` | pilihan | `ringan` | `ringan` / `full` / `tidak` — hapus aplikasi bawaan |
| `win10` | ☑ | mati | Tampilan ala Windows 10 (bukan mengganti OS) |
| `ekstra` | ☑ | mati | Lightshot, wallpaper, taskbar translucent, editor |
| `devtools` | ☑ | aktif | WinRAR, VC++ terbaru, XAMPP, aturan port 7777. Opsional dan tidak menggagalkan sesi jika error |
| `grafis` | ☑ | mati | Toolkit Mesa (CPU, bukan GPU fisik) |
| `roblox`, `minecraft_java`, `minecraft_bedrock` | ☑ | mati | Pemeriksaan/persiapan kompatibilitas, bukan jaminan bisa main |
| `portmap_host`, `portmap_port` | teks | kosong | Hanya untuk `akses = portmap` |

Secret yang dipakai workflow: `RDP_PASSWORD` (wajib), `TAILSCALE_AUTH_KEY` (wajib untuk Tailscale), `CLEANUP_TOKEN` dan `PORTMAP_OVPN_CONFIG` (opsional).

## Struktur repository

```
.github/workflows/rdp-6h.yml   satu-satunya workflow (sesi Windows)
scripts/                       skrip PowerShell persiapan host (RDP, Tailscale, XyDesk, game, media)
assets/                        wallpaper dan konfigurasi (rdp-extras.json)
web-next/                      dashboard Next.js / OpenNext / Cloudflare  (lihat SETUP-WEB.md)
  src/lib/brand.ts             identitas, domain, repo template, link XyDesk
  src/app/theme.css            tema hitam + ungu
docs/                          catatan teknis host Windows
integrasi-xydesk/              paket integrasi untuk aplikasi XyDesk Remote
SETUP.md                       panduan menjalankan workflow
SETUP-WEB.md                   panduan memasang dashboard web
```

## Batasan dan keamanan

- Workflow mengubah kebijakan Windows (termasuk UAC dan akun administrator). Gunakan hanya untuk sesi sekali pakai, **bukan** untuk komputer kerja utama, dan jangan membagikan password atau auth key.
- Durasi job maksimal 360 menit termasuk setup; tidak ada jaminan sesi bebas suspend atau cocok untuk game berat. Runner tidak punya GPU fisik.
- Workflow berjalan di akun GitHub kamu dan memakai kuota GitHub Actions. Memakai Actions di luar tujuan CI/CD bisa melanggar ketentuan GitHub dan berisiko membuat akun dibatasi atau ditangguhkan.
- Tidak ada Pinggy, ngrok, atau relay publik pada workflow; akses default hanya lewat Tailscale privat.

---

© KzRDP · Kazama Tech
