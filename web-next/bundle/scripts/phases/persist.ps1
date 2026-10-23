# Tahap 6 — Simpan sesi: folder pengguna dikemas, lalu diunggah oleh langkah berikutnya.
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/../lib/common.ps1"
. "$PSScriptRoot/../lib/ui.ps1"
$script:XyTag = 'KzRDP:persist'
Write-Phase '6/6' 'Simpan sesi'
[void](Invoke-Part 'Kemas folder pengguna' 'session/persist-state.ps1' -TimeoutMin 10 -Soft)
Write-Summary 'Simpan sesi'
