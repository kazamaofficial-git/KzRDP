# Tahap 4 — Opsi tambahan (berjalan saat sesi sudah bisa dipakai). Semua tahap bersifat opsional.
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/../lib/common.ps1"
. "$PSScriptRoot/../lib/ui.ps1"
$script:XyTag = 'KzRDP:extras'
Write-Phase '4/6' 'Opsi tambahan'

[void](Invoke-Part 'Storage boost' 'setup/storage.ps1' -TimeoutMin 15 -Soft -When ($env:STORAGE_BOOST -eq 'ya'))
[void](Invoke-Part 'Tampilan Windows 10' 'setup/win10.ps1' -TimeoutMin 15 -Soft -When ($env:WIN10 -eq 'ya'))
[void](Invoke-Part 'Toolkit grafis (Mesa CPU)' 'setup/grafis.ps1' -TimeoutMin 12 -Soft -When ($env:GRAFIS -eq 'software'))
[void](Invoke-Part 'Tampilan, wallpaper, dan editor' 'setup/extras.ps1' -TimeoutMin 20 -Soft -When ($env:EXTRAS -eq 'ya'))
[void](Invoke-Part 'Dependensi legacy x86/x64' 'setup/samp.ps1' -TimeoutMin 15 -Soft -When ($env:SAMP -eq 'ya'))
[void](Invoke-Part 'Persiapan game dan laporan kompatibilitas' 'setup/games.ps1' -TimeoutMin 20 -Soft)
[void](Invoke-Part 'Tools dev — WinRAR, VC++, XAMPP' 'setup/host-tools.ps1' -TimeoutMin 25 -Soft -When ($env:DEVTOOLS -eq 'ya'))
[void](Invoke-Part 'Explorer — file tersembunyi, ekstensi, tema gelap' 'setup/explorer.ps1' -TimeoutMin 2 -Soft)
[void](Invoke-Part 'Publikasi status ke branch status' 'session/publish-status.ps1' '-Active $true' -TimeoutMin 10 -Soft)
Write-Summary 'Opsi tambahan'
