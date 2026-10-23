# KzRDP session lifetime uses the published expiry, not a fresh full duration after setup.
$XyTag='KzRDP:session'
. "$PSScriptRoot/../lib/common.ps1"
. "$PSScriptRoot/../lib/ui.ps1"
$st=Read-Status
if (-not $st -or -not $st.expires_at) { throw 'Status sesi tidak memiliki expires_at' }
$stop=[DateTimeOffset]::Parse($st.expires_at).UtcDateTime.AddMinutes(-2)
$ip=$st.akses.tailscale.ip
$endpoint=if($st.akses.mode -eq 'portmap'){"$($st.akses.portmap.host):$($st.akses.portmap.port)"}else{"$ip`:3389"}
Write-Banner 'SUDAH ONLINE — sesi aktif' @(
  "Host      : $endpoint",
  "Username  : $($st.rdp_user)",
  'Password  : tidak ditulis di log (cek DM Telegram / dashboard)',
  "Berakhir  : $($st.expires_at) UTC"
) '1;32'
Write-Host (C '90' '  Jika desktop hitam tetapi pointer terlihat: Ctrl+Alt+End > Task Manager > Run new task > explorer.exe')
if ($env:GITHUB_STEP_SUMMARY) {
  @(
    '## 🟢 Sesi aktif', '',
    "Berakhir **$($st.expires_at) UTC**. Log di bawah menampilkan sisa waktu secara berkala.", '',
    '> Koneksi siap bukan bukti semua game berhasil dijalankan.', ''
  ) -join "`n" | Out-File -Append -Encoding utf8 $env:GITHUB_STEP_SUMMARY
}
# Statistik live (RAM/disk/CPU/uptime) dipublikasikan tiap 60 detik ke branch
# status supaya app XyDesk bisa menampilkannya tanpa web/token perantara —
# cukup baca out/rdp-status.json dari fork sendiri.
$nextPublish=(Get-Date).ToUniversalTime()
$sessionStart=[DateTimeOffset]::Parse($st.expires_at).UtcDateTime.AddMinutes(-[double]($env:DUR ?? 360))
$nextLog=(Get-Date).ToUniversalTime()
while ((Get-Date).ToUniversalTime() -lt $stop) {
  $left=$stop-(Get-Date).ToUniversalTime()
  if ((Get-Date).ToUniversalTime() -ge $nextLog) {
    Log "● online · sisa $($left.ToString('hh\:mm'))"
    $nextLog=(Get-Date).ToUniversalTime().AddMinutes(10)
  }
  if ((Get-Date).ToUniversalTime() -ge $nextPublish) {
    try {
      $os = Get-CimInstance Win32_OperatingSystem
      $ramTotal=[math]::Round($os.TotalVisibleMemorySize/1MB,2)
      $ramFree =[math]::Round($os.FreePhysicalMemory/1MB,2)
      $ramUsed =[math]::Round($ramTotal-$ramFree,2)
      $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
      $diskTotal=[math]::Round($disk.Size/1GB,1)
      $diskFree =[math]::Round($disk.FreeSpace/1GB,1)
      $cpuLoad = Get-CimInstance Win32_Processor | ForEach-Object { $_.LoadPercentage } | Where-Object { $_ }
      $cpu = if ($cpuLoad) { [int]($cpuLoad | Measure-Object -Average).Average } else { 0 }
      $uptime = [int]((Get-Date).ToUniversalTime() - $sessionStart).TotalMinutes
      if ($uptime -lt 0) { $uptime = 0 }
      Update-Status @{
        heartbeat_at=(Get-Date).ToUniversalTime().ToString('o')
        statistik=[pscustomobject]@{
          ram_total_gb=$ramTotal
          ram_used_gb=$ramUsed
          ram_free_gb=$ramFree
          disk_total_gb=$diskTotal
          disk_free_gb=$diskFree
          cpu_percent=$cpu
          uptime_menit=$uptime
          updated_at=(Get-Date).ToUniversalTime().ToString('o')
        }
      } | Out-Null
      & "$PSScriptRoot/publish-status.ps1" -Active $true
    } catch { Log "publikasi statistik gagal (lanjut): $($_.Exception.Message)" }
    $nextPublish=(Get-Date).ToUniversalTime().AddSeconds(60)
  }
  Start-Sleep -Seconds ([int][Math]::Max(1,[Math]::Min(60,$left.TotalSeconds)))
}
Log 'Durasi selesai; lanjut finalize.'
