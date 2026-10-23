# Tunnel TCP ke RDP lewat bore (server bore milik sendiri). Endpoint/rahasia berasal dari server dan tidak ditulis ke log/status.
$XyTag = 'KzRDP:tunnel'
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/../lib/common.ps1"

foreach ($k in 'HOST', 'PORT', 'SECRET', 'BORE_URL', 'BORE_SHA256') {
  if (-not (Get-Item "env:KZRDP_TUNNEL_$k" -ErrorAction SilentlyContinue).Value) { throw "Konfigurasi tunnel dari server tidak lengkap ($k)." }
}
$root = Join-Path $env:RUNNER_TEMP 'bore'
New-Item -ItemType Directory -Force -Path $root | Out-Null
$zip = Join-Path $root 'bore.zip'
Log 'Mengunduh klien bore...'
Get-File $env:KZRDP_TUNNEL_BORE_URL $zip 180
$hash = (Get-FileHash $zip -Algorithm SHA256).Hash
if ($hash -ne $env:KZRDP_TUNNEL_BORE_SHA256.ToUpper()) { throw 'SHA256 paket bore tidak cocok dengan yang dipin server; tunnel dibatalkan.' }
Expand-Archive -Path $zip -DestinationPath $root -Force
$exe = Get-ChildItem $root -Recurse -Filter 'bore.exe' | Select-Object -First 1
if (-not $exe) { throw 'bore.exe tidak ditemukan di dalam paket.' }

$log = Join-Path $root 'bore.out.log'; $err = Join-Path $root 'bore.err.log'
$env:BORE_SECRET = $env:KZRDP_TUNNEL_SECRET   # lewat env, bukan argumen baris perintah
$p = Start-Process -FilePath $exe.FullName -ArgumentList @('local', '3389', '--to', $env:KZRDP_TUNNEL_HOST, '--port', $env:KZRDP_TUNNEL_PORT) `
  -PassThru -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError $err
$up = $false
for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Seconds 1
  if ($p.HasExited) { break }
  if (Select-String -Path $log, $err -Pattern 'listening at' -Quiet -ErrorAction SilentlyContinue) { $up = $true; break }
}
if (-not $up) {
  $why = (Get-Content $err, $log -ErrorAction SilentlyContinue | Select-Object -Last 3) -join ' / '
  throw "Tunnel tidak aktif ($why). Periksa server bore dan secret-nya."
}
Log "Tunnel aktif (pid $($p.Id)). Endpoint hanya dikirim ke Telegram."
Update-Status @{ akses = @{ mode = 'tunnel'; tunnel = @{ status = 'ok' } } } | Out-Null
