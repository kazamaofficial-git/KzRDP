# ============================================================================
#  persist-state.ps1 — simpan folder pengguna ke out/kzrdp-state.zip untuk
#  di-upload sebagai artifact `kzrdp-state` (dipulihkan restore-state.ps1
#  pada sesi berikutnya). Folder: Desktop, Documents, Downloads, Pictures,
#  Music, Videos. Sistem/software tidak disimpan (ephemeral runner).
#
#  Env: RDP_USER, GITHUB_WORKSPACE, RUNNER_TEMP.
# ============================================================================
$ErrorActionPreference = 'Continue'
function Log([string]$m) { Write-Host "[KzRDP:persist] $m" }

$profile = "C:\Users\$env:RDP_USER"
if (-not (Test-Path $profile)) { $profile = $env:USERPROFILE }
Log "profil sumber: $profile"

$dirs = @('Desktop','Documents','Downloads','Pictures','Music','Videos')
$staging = Join-Path $env:RUNNER_TEMP 'kzrdp-persist'
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }

$total = 0L
foreach ($d in $dirs) {
  $src = Join-Path $profile $d
  if (-not (Test-Path $src)) { continue }
  $size = (Get-ChildItem $src -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
  if (-not $size -or $size -lt 1) { continue }
  New-Item -ItemType Directory -Path (Join-Path $staging $d) -Force | Out-Null
  Copy-Item -Path (Join-Path $src '*') -Destination (Join-Path $staging $d) -Recurse -Force
  $total += $size
  Log "  $d : $([math]::Round($size/1MB,1)) MB"
}

if ($total -lt 1) { Log 'tidak ada data pengguna untuk disimpan'; exit 0 }
if ($total -gt 2GB) { Log "PERINGATAN: total $([math]::Round($total/1GB,2)) GB di atas 2 GB — upload bisa lambat/gagal." }

$out = Join-Path $env:GITHUB_WORKSPACE 'out\kzrdp-state.zip'
New-Item -ItemType Directory -Path (Split-Path $out -Parent) -Force | Out-Null
Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $out -Force
Log "simpanan sesi: $([math]::Round($total/1MB,1)) MB → $out"
