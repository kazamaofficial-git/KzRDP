# ============================================================================
#  restore-state.ps1 — pulihkan folder pengguna dari artifact `kzrdp-state`
#  milik run sebelumnya, supaya sesi BARU tidak mulai dari nol.
#
#  Sumber: artifact GitHub Actions (nama kzrdp-state, retention 90 hari).
#  Gagal restore TIDAK mematikan sesi — hanya log peringatan.
#  Env: GH_TOKEN (Actions token, actions:read cukup), RDP_USER.
# ============================================================================
$ErrorActionPreference = 'Continue'
function Log([string]$m) { Write-Host "[KzRDP:restore] $m" }

$repo = $env:GITHUB_REPOSITORY
if (-not $repo) { Log 'bukan lingkungan Actions — skip'; exit 0 }
$tok = $env:GH_TOKEN
if (-not $tok) { $tok = $env:GITHUB_TOKEN }
if (-not $tok) { Log 'token tidak tersedia — skip'; exit 0 }

$headers = @{ Authorization = "Bearer $tok"; Accept = 'application/vnd.github+json'; 'User-Agent' = 'KzRDP' }

try {
  $arts = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/actions/artifacts?name=kzrdp-state&per_page=5" -Headers $headers -TimeoutSec 30
} catch { Log "daftar artifact gagal: $($_.Exception.Message)"; exit 0 }

$cand = @($arts.artifacts) | Where-Object { $_.expired -eq $false -and $_.size_bytes -gt 0 } | Select-Object -First 1
if (-not $cand) { Log 'tidak ada simpanan sesi sebelumnya — mulai bersih.'; exit 0 }
Log "menemukan simpanan $([math]::Round($cand.size_bytes/1MB,1)) MB dari run $($cand.run_id) — mengunduh..."

$zip = Join-Path $env:RUNNER_TEMP 'kzrdp-state.zip'
try {
  Invoke-WebRequest -Uri $cand.archive_download_url -Headers $headers -OutFile $zip -TimeoutSec 600
} catch { Log "unduh artifact gagal: $($_.Exception.Message)"; exit 0 }

$dest = Join-Path $env:RUNNER_TEMP 'kzrdp-state'
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
try { Expand-Archive -Path $zip -DestinationPath $dest -Force } catch { Log "ekstrak gagal: $($_.Exception.Message)"; exit 0 }

$profile = "C:\Users\$env:RDP_USER"
if (-not (Test-Path $profile)) { $profile = $env:USERPROFILE }

$n = 0
Get-ChildItem $dest -Directory | ForEach-Object {
  $target = Join-Path $profile $_.Name
  New-Item -ItemType Directory -Path $target -Force | Out-Null
  Copy-Item -Path (Join-Path $_.FullName '*') -Destination $target -Recurse -Force
  $n++
}
Log "selesai: $n folder dikembalikan ke $profile — sesi lanjut, bukan dari nol."
