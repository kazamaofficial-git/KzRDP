# Menghubungkan workflow ke layanan KzRDP: verifikasi token, kirim data RDP ke Telegram, tandai sesi selesai.
#   ready  : kirim host/port/username/password ke DM Telegram pemilik token (via server)
#   ended  : tandai sesi berakhir (memulai jeda 1 jam sebelum token baru)
param([Parameter(Mandatory)][ValidateSet('ready','ended')][string]$Action)
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/../lib/common.ps1"
$api = if ($env:KZRDP_API) { $env:KZRDP_API.TrimEnd('/') } else { 'https://rdp.kazamasite.biz.id' }

function Invoke-Kz([string]$Path, [hashtable]$Body) {
  $json = $Body | ConvertTo-Json -Compress -Depth 4
  for ($i = 1; $i -le 3; $i++) {
    try { return Invoke-RestMethod -Uri "$api$Path" -Method Post -ContentType 'application/json' -Body $json -TimeoutSec 30 }
    catch {
      $code = 0; try { $code = [int]$_.Exception.Response.StatusCode } catch {}
      $msg = ''; try { $msg = ($_.ErrorDetails.Message | ConvertFrom-Json).error } catch {}
      if ($code -ge 400 -and $code -lt 500) { throw "KzRDP menolak ($code): $msg" }
      if ($i -eq 3) { throw "KzRDP tidak terjangkau: $($_.Exception.Message)" }
      Start-Sleep -Seconds (3 * $i)
    }
  }
}

if (-not $env:KZRDP_SESSION_ID -or -not $env:KZRDP_SESSION_KEY) { Log 'Tidak ada sesi token; dilewati.'; exit 0 }
$auth = @{ session_id = $env:KZRDP_SESSION_ID; session_key = $env:KZRDP_SESSION_KEY }

if ($Action -eq 'ended') {
  try { Invoke-Kz '/api/v1/rdp/report' ($auth + @{ event = 'ended' }) | Out-Null; Log 'Sesi ditandai selesai.' }
  catch { Log "Gagal menandai selesai: $($_.Exception.Message)" }
  exit 0
}

# ready: tentukan host:port. Tunnel (dari server) > Portmap > IP Tailscale.
$st = Read-Status
$hostName = ''; $port = 3389
if ($env:KZRDP_TUNNEL_HOST -and $env:KZRDP_TUNNEL_PORT) {
  $hostName = $env:KZRDP_TUNNEL_HOST; $port = [int]$env:KZRDP_TUNNEL_PORT
} elseif ($st -and $st.akses -and $st.akses.portmap -and $st.akses.portmap.host -and [int]$st.akses.portmap.port -gt 0) {
  $hostName = "$($st.akses.portmap.host)"; $port = [int]$st.akses.portmap.port
} else {
  foreach ($ts in @('C:\Program Files\Tailscale\tailscale.exe', 'tailscale')) {
    try { $ip = (& $ts ip -4 2>$null | Select-Object -First 1); if ($ip -match '^\d{1,3}(\.\d{1,3}){3}$') { $hostName = $ip; break } } catch {}
  }
}
if (-not $hostName) { throw 'Host koneksi belum tersedia (Tailscale/portmap belum siap).' }
$user = if ($env:RDP_USER) { $env:RDP_USER } elseif ($st -and $st.rdp_user) { "$($st.rdp_user)" } else { 'kzadmin' }
$res = Invoke-Kz '/api/v1/rdp/report' ($auth + @{ event = 'ready'; host = $hostName; port = $port; username = $user; password = "$env:RDP_PASSWORD" })
Log "Data RDP dikirim ke Telegram (terkirim=$($res.delivered))."
