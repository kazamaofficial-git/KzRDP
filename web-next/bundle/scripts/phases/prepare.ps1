# Tahap 2 — Siapkan sistem: RDP, sesi lama, XyDesk host, akses, media, status awal.
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/../lib/common.ps1"
. "$PSScriptRoot/../lib/ui.ps1"
$script:XyTag = 'KzRDP:prepare'
Write-Phase '2/6' 'Siapkan sistem'

if (-not (Invoke-Part 'Setup dasar — user admin + RDP 3389' 'setup/rdp.ps1' -TimeoutMin 15)) { exit 1 }
[void](Invoke-Part 'Pulihkan sesi sebelumnya' 'session/restore-state.ps1' -TimeoutMin 10 -Soft)
[void](Invoke-Part 'XyDesk Remote — AVC444, ClearType, audio/mic' 'setup/xydesk.ps1' -TimeoutMin 10 -Soft -When ($env:XYDESK -eq 'ya'))
$ok = switch ($env:AKSES) {
  'portmap' { Invoke-Part 'Akses publik — Portmap (OpenVPN)' 'setup/portmap.ps1' -TimeoutMin 8 }
  'tunnel'  { Invoke-Part 'Akses publik — Tunnel domain' 'setup/tunnel.ps1' -TimeoutMin 6 }
  default   { Invoke-Part 'Akses privat — Tailscale' 'setup/akses.ps1' -TimeoutMin 15 }
}
if (-not $ok) { exit 1 }
[void](Invoke-Part 'Wallpaper dan mikrofon' 'setup/media.ps1' -TimeoutMin 5 -Soft)
[void](Invoke-Part 'Publikasi koneksi awal' 'session/publish-status.ps1' '-Active $true' -TimeoutMin 10 -Soft)
Write-Summary 'Persiapan sistem'
