# Tahap 3 — Kirim data: data RDP ke Telegram + banner koneksi. Link XyDesk hanya tampil selama sesi berjalan.
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/../lib/common.ps1"
. "$PSScriptRoot/../lib/ui.ps1"
$script:XyTag = 'KzRDP:send'
Write-Phase '3/6' 'Kirim data'

$sent = Invoke-Part 'Kirim data RDP ke Telegram' 'session/kzrdp-token.ps1' '-Action ready' -TimeoutMin 5 -Soft
$st = Read-Status
if (-not $st) { throw 'Status sesi belum tersedia.' }
$endpoint = if ($env:KZRDP_TUNNEL_HOST) { "$($env:KZRDP_TUNNEL_HOST):$($env:KZRDP_TUNNEL_PORT)" }
  elseif ($st.akses.mode -eq 'portmap') { "$($st.akses.portmap.host):$($st.akses.portmap.port)" }
  else { "$($st.akses.tailscale.ip):3389" }
# Alamat adalah kunci akses: di repository publik tidak ditulis ke log; hanya dikirim ke Telegram pemilik token.
$showHost = ($env:REPO_PRIVATE -eq 'true')
$lines = @(
  "Host      : $(if ($showHost) { $endpoint } else { 'dikirim ke DM Telegram (tidak ditulis di log publik)' })",
  "Username  : $env:RDP_USER",
  "Password  : $(if ($sent) { 'dikirim ke DM Telegram' } else { 'lihat di dashboard / password managermu' }) (tidak ditulis di log)",
  "Berakhir  : $($st.expires_at) UTC"
)
Write-Host ''
Write-Banner 'KONEKSI SIAP' $lines '1;32'
Write-Host ((C '1;35' '  Unduh XyDesk Remote : ') + (C '4;96' "$env:XYDESK_URL") + (C '90' '  (hanya tersedia selama sesi berjalan)'))
Write-Host (C '90' '  Jika desktop hitam tetapi pointer terlihat: Ctrl+Alt+End > Task Manager > Run new task > explorer.exe')
Write-Host ''

if ($env:GITHUB_STEP_SUMMARY) {
  $hostShown = if ($showHost) { "``$endpoint``" } else { 'dikirim ke Telegram' }
  @(
    '## 🟢 Koneksi siap', '',
    '| | |', '| --- | --- |',
    "| Host | $hostShown |", "| Username | ``$env:RDP_USER`` |",
    "| Password | $(if ($sent) { 'dikirim ke Telegram' } else { 'tidak dikirim — cek dashboard' }) |",
    "| Berakhir (UTC) | $($st.expires_at) |", '',
    '> Link unduh XyDesk dan data lengkap hanya dikirim ke Telegram dan tampil di log selama sesi berjalan.', ''
  ) -join "`n" | Out-File -Append -Encoding utf8 $env:GITHUB_STEP_SUMMARY
}
Write-Summary 'Kirim data'
