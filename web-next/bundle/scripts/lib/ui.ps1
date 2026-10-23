# Tampilan log modern + eksekusi tahap dengan batas waktu + ringkasan job. Dipakai scripts/phases/*.ps1.
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}
$script:Esc = [char]27
$script:ScriptsRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$script:Results = [System.Collections.Generic.List[object]]::new()

function C([string]$Code, [string]$Text) { "$($script:Esc)[${Code}m$Text$($script:Esc)[0m" }

function Write-Phase([string]$Num, [string]$Title) {
  Write-Host ''
  Write-Host (C '1;36' "━━ $Num  $Title ━━")
}

function Write-Banner([string]$Title, [string[]]$Lines = @(), [string]$Color = '1;35') {
  $all = @($Title) + $Lines
  $w = [Math]::Max(58, ($all | ForEach-Object { $_.Length } | Measure-Object -Maximum).Maximum + 4)
  Write-Host (C $Color ('╭' + ('─' * $w) + '╮'))
  Write-Host ((C $Color '│ ') + (C '1;97' $Title.PadRight($w - 2)) + (C $Color ' │'))
  if ($Lines.Count) { Write-Host (C $Color ('├' + ('─' * $w) + '┤')) }
  foreach ($l in $Lines) { Write-Host ((C $Color '│ ') + $l.PadRight($w - 2) + (C $Color ' │')) }
  Write-Host (C $Color ('╰' + ('─' * $w) + '╯'))
}

# Menjalankan satu skrip sebagai proses anak dengan batas waktu. -Soft: kegagalan hanya peringatan.
# Mengembalikan $true bila tahap berhasil (atau gagal tetapi -Soft atau dilewati).
function Invoke-Part {
  param(
    [string]$Title, [string]$Script, [string]$ScriptArgs = '',
    [int]$TimeoutMin = 10, [switch]$Soft, [bool]$When = $true
  )
  if (-not $When) {
    $script:Results.Add([pscustomobject]@{ Title = $Title; Status = 'skip'; Sec = 0 }) | Out-Null
    Write-Host (C '90' "○ $Title — dilewati (opsi nonaktif)")
    return $true
  }
  $path = Join-Path $script:ScriptsRoot $Script
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $code = 1; $timedOut = $false
  Write-Host "::group::▶ $Title"
  try {
    $cmd = '$ErrorActionPreference = ''stop''; & ''' + $path + ''' ' + $ScriptArgs + '; if ((Test-Path -LiteralPath variable:\LASTEXITCODE)) { exit $LASTEXITCODE }'
    $enc = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($cmd))
    $p = Start-Process -FilePath (Get-Process -Id $PID).Path -ArgumentList @('-NoProfile', '-NonInteractive', '-EncodedCommand', $enc) -PassThru -NoNewWindow
    $null = $p.Handle   # menjaga ExitCode tetap terbaca
    if ($p.WaitForExit($TimeoutMin * 60000)) { $p.WaitForExit(); $code = $p.ExitCode }
    else { $timedOut = $true; $code = 124; try { $p.Kill($true) } catch {} }
  } catch {
    Write-Host "Gagal menjalankan tahap: $($_.Exception.Message)"
    $code = 1
  }
  Write-Host '::endgroup::'
  $sw.Stop(); $sec = [int]$sw.Elapsed.TotalSeconds
  $why = if ($timedOut) { "melewati batas $TimeoutMin menit" } else { "kode keluar $code" }
  $status = if ($code -eq 0) { 'ok' } elseif ($Soft) { 'warn' } else { 'fail' }
  $script:Results.Add([pscustomobject]@{ Title = $Title; Status = $status; Sec = $sec }) | Out-Null
  switch ($status) {
    'ok'   { Write-Host ((C '32' "✔ $Title") + (C '90' " ($($sec) dtk)")) }
    'warn' { Write-Host ((C '33' "⚠ $Title — $why, sesi tetap dilanjutkan") + (C '90' " ($($sec) dtk)")); Write-Host "::warning title=$Title::$why" }
    'fail' { Write-Host ((C '31' "✖ $Title — $why") + (C '90' " ($($sec) dtk)")); Write-Host "::error title=$Title::$why" }
  }
  return ($status -ne 'fail')
}

# Menambahkan tabel tahap ke ringkasan job (GitHub Step Summary).
function Write-Summary([string]$Heading) {
  if (-not $env:GITHUB_STEP_SUMMARY -or -not $script:Results.Count) { return }
  $icon = @{ ok = '✅'; warn = '⚠️'; fail = '❌'; skip = '⏭️' }
  $rows = foreach ($r in $script:Results) {
    $t = if ($r.Status -eq 'skip') { '—' } else { "$($r.Sec) dtk" }
    "| $($icon[$r.Status]) | $($r.Title) | $t |"
  }
  (@("### $Heading", '', '| | Tahap | Waktu |', '| :-: | --- | --: |') + $rows + @('')) -join "`n" |
    Out-File -Append -Encoding utf8 $env:GITHUB_STEP_SUMMARY
}
