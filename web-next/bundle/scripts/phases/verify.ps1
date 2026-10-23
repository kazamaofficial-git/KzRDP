# Tahap 1 (lanjutan) — dijalankan setelah paket diunduh: durasi, password, info lingkungan.
# Token, email, dan username GitHub sudah diverifikasi server sebelum paket ini bisa diunduh.
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/../lib/common.ps1"
. "$PSScriptRoot/../lib/ui.ps1"
$script:XyTag = 'KzRDP:verify'
Write-Phase '1/6' 'Verifikasi'

# Durasi: angka menit 10–360 (maks 6 jam, termasuk waktu persiapan).
$raw = "$env:DUR".Trim()
if ($raw -notmatch '^\d{1,3}$' -or [int]$raw -lt 10 -or [int]$raw -gt 360) {
  Write-Host "::error title=Durasi tidak valid::Isi menit antara 10 dan 360 (nilai sekarang: '$raw')."
  exit 1
}
$dur = [int]$raw
$used = [Math]::Min($dur, 355)   # 5 menit cadangan untuk simpan sesi + finalisasi (batas job GitHub 360 menit)


# Password RDP: pakai secret RDP_PASSWORD bila ada, jika kosong dibuat acak (dikirim ke Telegram, tidak ke log).
$pw = "$env:RDP_PASSWORD_SECRET"
$generated = $false
if ($pw.Length -lt 8) {
  $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  $bytes = [byte[]]::new(18); [Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  $pw = 'Kz#' + (($bytes | ForEach-Object { $chars[$_ % $chars.Length] }) -join '') + '9a'
  $generated = $true
}
Write-Host "::add-mask::$pw"
Add-Content -Path $env:GITHUB_ENV -Value "RDP_PASSWORD=$pw"

$os = Get-CimInstance Win32_OperatingSystem
$disks = Get-CimInstance Win32_LogicalDisk | Where-Object { $_.Size } | ForEach-Object { '{0} {1:N0} GB total / {2:N0} GB bebas' -f $_.DeviceID, ($_.Size / 1GB), ($_.FreeSpace / 1GB) }
$opts = @()
foreach ($o in @(@('XYDESK', 'XyDesk'), @('MICROPHONE', 'Mikrofon'), @('SAMP', 'Dependensi legacy'), @('STORAGE_BOOST', 'Storage boost'), @('WIN10', 'Tampilan Win10'), @('EXTRAS', 'Ekstra'), @('DEVTOOLS', 'Tools dev'))) {
  if ((Get-Item "env:$($o[0])" -ErrorAction SilentlyContinue).Value -eq 'ya') { $opts += $o[1] }
}
if ($env:GRAFIS -eq 'software') { $opts += 'Grafis Mesa' }
$lines = @(
  "Windows   : $($os.Caption) (build $($os.Version))",
  "Runner    : $env:KZRDP_RUNNER",
  ("Durasi    : $dur menit" + $(if ($used -lt $dur) { " (dipakai $used; 5 menit cadangan simpan sesi)" } else { '' })),
  "Akses     : $env:AKSES",
  "Pengguna  : $env:RDP_USER",
  "Password  : $(if ($generated) { 'dibuat acak (dikirim ke Telegram)' } else { 'dari secret RDP_PASSWORD' })",
  "Opsi      : $(if ($opts.Count) { $opts -join ', ' } else { '-' })"
) + @($disks | ForEach-Object { "Disk      : $_" })
Write-Banner 'KzRDP — sesi dimulai' $lines '1;35'

if ($env:GITHUB_STEP_SUMMARY) {
  @(
    '## 🖥️ KzRDP — sesi RDP', '',
    '| Pengaturan | Nilai |', '| --- | --- |',
    "| Windows | $($os.Caption) |", "| Runner | ``$env:KZRDP_RUNNER`` |",
    "| Durasi | $dur menit |", "| Akses | $env:AKSES |", "| Pengguna RDP | ``$env:RDP_USER`` |",
    "| Opsi aktif | $(if ($opts.Count) { $opts -join ', ' } else { '-' }) |", ''
  ) -join "`n" | Out-File -Append -Encoding utf8 $env:GITHUB_STEP_SUMMARY
}
Write-Summary 'Verifikasi'
