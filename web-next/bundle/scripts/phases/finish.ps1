# Penutup — matikan akses, bersihkan, tandai sesi selesai. Selalu dijalankan (juga saat dibatalkan).
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/../lib/common.ps1"
. "$PSScriptRoot/../lib/ui.ps1"
$script:XyTag = 'KzRDP:finish'
Write-Phase '✓' 'Selesai'
[void](Invoke-Part 'Matikan status publik' 'session/publish-status.ps1' '-Active $false' -TimeoutMin 10 -Soft)
[void](Invoke-Part 'Finalisasi — matikan akses' 'session/finalize-rdp.ps1' -TimeoutMin 10 -Soft)
[void](Invoke-Part 'Bersihkan run lama' 'session/cleanup-actions.ps1' -TimeoutMin 10 -Soft)
[void](Invoke-Part 'Tandai sesi selesai' 'session/kzrdp-token.ps1' '-Action ended' -TimeoutMin 5 -Soft)
Write-Host ''
Write-Banner 'SESI SELESAI' @('Data sesi disimpan dan akses dimatikan.', 'Token baru bisa dibuat 1 jam setelah RDP berakhir.') '1;34'
Write-Summary 'Penutup'
