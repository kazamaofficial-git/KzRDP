# Tahap 5 — Sesi aktif: menjaga runner hidup sampai waktu habis.
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/../lib/common.ps1"
. "$PSScriptRoot/../lib/ui.ps1"
Write-Phase '5/6' 'Sesi aktif'
& "$PSScriptRoot/../session/keepalive.ps1"
