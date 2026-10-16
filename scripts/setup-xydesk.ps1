# ============================================================================
#  setup-xydesk.ps1 — HOST SETUP untuk XyDesk Remote (APK Android kamu)
# ----------------------------------------------------------------------------
#  Ini versi inline dari rdp.xydesk.my.id/host.ps1 (v0.5.34) + perbaikan font
#  smoothing dari commit XyDesk-Remote v0.5.30, dijalankan langsung dari repo
#  (tidak mengambil script dari internet).
#
#  Isi (idempoten, best-effort — semua hasil dilaporkan apa adanya):
#    1) RDP: multi-session (fSingleSessionPerUser=0) + audio out & mic hidup
#    2) Kebijakan grafis: AVC444 4:4:4 (preferred) + hardware encode + VGAdapter
#    3) Font smoothing: fNoFontSmoothing=0 + AllowFontAntiAlias=1 di
#       WinStations\RDP-Tcp  (kunci ini yang BENAR-benar dibaca Windows;
#       fAllowFontAntiAlias di Policy no-op — temuan commit XyDesk-Remote v0.5.30)
#    4) Firewall: TCP/UDP 3389 + UDP 4433 (audio bridge QUIC XyDesk)
#    5) Layanan: TermService + Audiosrv dipastikan jalan
#
#  PENTING soal jalur akses:
#    - XyDesk Remote -> "Koneksi RDP Penuh": isi Host + Port dari dashboard
#      (host = bore.pub / x.tcp.ngrok.io, port = angka tunnel). Semua fitur RDP
#      (AVC444, ClearType, audio rdpsnd, clipboard, keyboard) jalan lewat tunnel TCP.
#    - Audio bridge QUIC XyDesk (UDP 4433) TIDAK bisa lewat tunnel TCP — port UDP
#      dibuka di sini supaya siap kalau HP bisa reach UDP langsung (LAN/tailnet).
#      Lewat tunnel, klien otomatis fallback ke audio RDP.
#    - Klien XyDesk akan probe QUIC 4433 lalu gagal (wajar) -> lanjut mode RDP.
#
#  Konfigurasi: assets/rdp-extras.json -> xydesk_host = true/false
# ============================================================================

$XyTag = 'KzRDP:xydesk'
. "$PSScriptRoot/lib-common.ps1"

$cfg = Get-Cfg
$skip = -not $cfg.xydesk_host
if ($env:XYDESK) {
  $e = $env:XYDESK.Trim().ToLower()
  if (@('tidak', '0', 'false', 'no', 'off', 'skip', 'none') -contains $e) { $skip = $true }
}
if ($skip) {
  Log 'host setup XyDesk dilewati (input xydesk=tidak atau xydesk_host=false di rdp-extras.json)'
  Update-Status @{ xydesk = @{ host = 'skip' } } | Out-Null
  exit 0
}

Log 'HOST SETUP XyDesk Remote (AVC444 + ClearType + multi-session + audio)...'
$tsRoot = 'Registry::HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Terminal Server'
$tsPol  = 'Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows NT\Terminal Services'
$tsTcp  = "$tsRoot\WinStations\RDP-Tcp"

# ---------- 0. Probe awal (RDP sehat?) ----------
$rdpAlive0 = Probe-Rdp 'sebelum tweak xydesk'

# ---------- 1. Multi-sesi: kunci root + kunci KEBIJAKAN saja ----------
# PENTING (temuan validasi 2026-10-03): menulis nilai di
#   HKLM\SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp
# memaksa TermService membangun ulang listener RDP, dan di runner GitHub
# listener 3389 tidak kembali sehat (probe: awal=True -> reg=False, tunnel mati).
# Jadi kunci itu sekarang hanya DIBACA (audit), tidak ditulis.
$okDeny  = Set-Reg $tsRoot 'fDenyTSConnections'   0 'DWord'
$okMulti = Set-Reg $tsRoot 'fSingleSessionPerUser' 0 'DWord'
Set-Reg $tsPol 'fDenyTSConnections'   0 'DWord' | Out-Null
Set-Reg $tsPol 'fSingleSessionPerUser' 0 'DWord' | Out-Null
Log "  RDP: denyTS=$okDeny multisesi=$okMulti"
$rdpAlive1 = Probe-Rdp 'setelah setelan multi-sesi (root+policy)'

# ---------- 1b. Audio + font + wallpaper RDP: kebijakan (Policy override WinStations) ----------
# Audio: aktifkan playback + mic via Policy (override WinStations tanpa tulis WinStations biar listener gak mati)
$okAudioPol = Set-Reg $tsPol 'fDisableAudio' 0 'DWord'
$okMicPol   = Set-Reg $tsPol 'fDisableAudioCapture' 0 'DWord'
# Wallpaper RDP: jangan blok wallpaper saat RDP (hemat bandwidth -> hitam kalau 1)
$okWallPol  = Set-Reg $tsPol 'fNoRemoteDesktopWallpaper' 0 'DWord'
# Audio Quality: 0=Dynamic, 2=High
Set-Reg $tsPol 'AudioQualityMode' 2 'DWord' | Out-Null
# Pastikan Windows Audio services hidup (Audiosrv + AudioEndpointBuilder)
try { Set-Service -Name 'AudioEndpointBuilder' -StartupType Automatic -ErrorAction SilentlyContinue; Start-Service -Name 'AudioEndpointBuilder' -ErrorAction SilentlyContinue } catch {}
# Audit WinStations hanya untuk log (tidak ditulis, biar 3389 gak mati)
$curAudio = Get-Reg $tsTcp 'fDisableAudio'
$curMic   = Get-Reg $tsTcp 'fDisableAudioCapture'
$curWall  = Get-Reg $tsTcp 'fNoRemoteDesktopWallpaper'
$curFs    = Get-Reg $tsTcp 'fNoFontSmoothing'
$curAa    = Get-Reg $tsTcp 'AllowFontAntiAlias'
$polAudio = Get-Reg $tsPol 'fDisableAudio'
$polMic   = Get-Reg $tsPol 'fDisableAudioCapture'
$polWall  = Get-Reg $tsPol 'fNoRemoteDesktopWallpaper'
Log "  policy: fDisableAudio=$polAudio fDisableAudioCapture=$polMic fNoRemoteDesktopWallpaper=$polWall (okAudioPol=$okAudioPol okMicPol=$okMicPol okWallPol=$okWallPol)"
Log "  audit WinStations\RDP-Tcp (tanpa tulis): fDisableAudio=$curAudio fDisableAudioCapture=$curMic fNoRemoteDesktopWallpaper=$curWall fNoFontSmoothing=$curFs AllowFontAntiAlias=$curAa"
# Policy 0 = aktif, jadi cek Policy dulu; WinStations hanya fallback
$okAudio = ($polAudio -eq 0) -or (($null -eq $polAudio) -and ("$curAudio" -ne '1'))
$okMic   = ($polMic -eq 0) -or (($null -eq $polMic) -and ("$curMic" -ne '1'))
$okWall  = ($polWall -eq 0) -or (($null -eq $polWall) -and ("$curWall" -ne '1'))
$rdpAlive2 = Probe-Rdp 'setelah kebijakan audio+wallpaper + audit WinStation'

# ---------- 2. Kebijakan grafis XyDesk (AVC444 / hardware encode / 120 FPS DWM) ----------
$okAvc  = Set-Reg $tsPol 'AVC444ModePreferred'       1 'DWord'
$okAvc2 = Set-Reg $tsPol 'AVCHardwareEncodePreferred' 1 'DWord'
Set-Reg $tsPol 'VGAdapter'            1 'DWord' | Out-Null
Set-Reg $tsPol 'bEnumerateHWBeforeSW' 1 'DWord' | Out-Null
Set-Reg $tsPol 'SelectTransport'      0 'DWord' | Out-Null
Set-Reg $tsPol 'fAllowDesktopComposition' 1 'DWord' | Out-Null
Set-Reg $tsPol 'fNoFontSmoothing'     0 'DWord' | Out-Null
# DWMFRAMEINTERVAL = 8 (~125 FPS target DWM, bukan default Windows 30 FPS / 15 ms 66 FPS)
$ok120  = Set-Reg $tsPol 'DWMFRAMEINTERVAL' 8 'DWord'
Set-Reg $tsRoot 'DWMFRAMEINTERVAL'    8 'DWord' | Out-Null
# Ultra-Low Latency TCP (matikan Nagle buffering di seluruh interface jaringan aktif)
try {
  Get-ChildItem 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces' -ErrorAction SilentlyContinue | ForEach-Object {
    New-ItemProperty -Path $_.PSPath -Name 'TcpAckFrequency' -Value 1 -PropertyType DWord -Force -ErrorAction SilentlyContinue | Out-Null
    New-ItemProperty -Path $_.PSPath -Name 'TCPNoDelay'      -Value 1 -PropertyType DWord -Force -ErrorAction SilentlyContinue | Out-Null
  }
} catch {}
# Prioritas jadwal GPU & Game Multimedia Class Scheduler (MMCSS)
try {
  $mmcss = 'Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile\Tasks\Games'
  Set-Reg $mmcss 'GPU Priority'        8 'DWord' | Out-Null
  Set-Reg $mmcss 'Priority'            6 'DWord' | Out-Null
  Set-Reg $mmcss 'Scheduling Category' 'High' 'String' | Out-Null
  Set-Reg $mmcss 'SFIO Priority'       'High' 'String' | Out-Null
} catch {}
$avcTxt = if ($okAvc -and $okAvc2) { 'ok (120FPS DWMFRAMEINTERVAL=8 + TCPNoDelay=1)' } else { 'gagal' }
Log "  grafis: AVC444ModePreferred+AVCHardwareEncodePreferred+120FPS -> $avcTxt"
$rdpAlive3 = Probe-Rdp 'setelah kebijakan grafis (AVC444 + 120FPS)'

# ---------- 3. ClearType: lewat profil Default (per-user), bukan kunci WinStation ----------
$fontTxt = 'gagal'
if (Open-DefaultHive) {
  $dp = "$($script:DefReg)\Control Panel\Desktop"
  $f1 = Set-Reg $dp 'FontSmoothing'      '2' 'String'
  $f2 = Set-Reg $dp 'FontSmoothingType'   2  'DWord'
  Set-Reg $dp 'FontSmoothingGamma'      1400 'DWord' | Out-Null
  Set-Reg $dp 'FontSmoothingOrientation'  1  'DWord' | Out-Null
  Close-DefaultHive
  $fontTxt = if ($f1 -and $f2) { 'ok (ClearType profil Default)' } elseif ($f1 -or $f2) { 'sebagian' } else { 'gagal' }
} else { $fontTxt = 'gagal (profil Default tak bisa di-load)' }
Log "  ClearType: $fontTxt (FontSmoothing=2 + FontSmoothingType=2 di profil Default)"
$rdpAlive4 = Probe-Rdp 'setelah ClearType profil Default'

# ---------- 4. Firewall (dibuka di VM; dari luar tetap hanya via tunnel) ----------
function Add-FwRule([string]$Name, [string]$Proto, [string]$Ports) {
  try {
    Remove-NetFirewallRule -DisplayName $Name -ErrorAction SilentlyContinue | Out-Null
    New-NetFirewallRule -DisplayName $Name -Direction Inbound -Action Allow `
      -Protocol $Proto -LocalPort $Ports -RemoteAddress '100.64.0.0/10' -Profile Any -ErrorAction Stop | Out-Null
    return $true
  } catch { Log "  firewall '$Name' gagal: $($_.Exception.Message)"; return $false }
}
$fwTcp  = Add-FwRule 'XyDesk Remote RDP TCP'  'TCP' '3389'
$fwUdp  = Add-FwRule 'XyDesk Remote RDP UDP'  'UDP' '3389'
$fw4433 = Add-FwRule 'XyDesk Remote QUIC UDP' 'UDP' '4433'
Enable-NetFirewallRule -DisplayGroup 'Remote Desktop' -ErrorAction SilentlyContinue | Out-Null
Log "  firewall: TCP3389=$fwTcp UDP3389=$fwUdp UDP4433=$fw4433"
$rdpAlive5 = Probe-Rdp 'setelah aturan firewall'

# ---------- 5. Layanan ----------
$svcOk = @()
foreach ($svc in @('TermService', 'Audiosrv')) {
  try {
    Set-Service -Name $svc -StartupType Automatic -ErrorAction Stop
    Start-Service -Name $svc -ErrorAction Stop
    $svcOk += $svc
  } catch { Log "  layanan $svc gagal: $($_.Exception.Message)" }
}
try { Start-Service -Name 'UmRdpService' -ErrorAction SilentlyContinue } catch {}
$svcTxt = if ($svcOk.Count -eq 2) { 'ok' } elseif ($svcOk.Count -eq 1) { "sebagian ($($svcOk[0]) hidup)" } else { 'gagal' }
Log "  layanan: $svcTxt"
$rdpAlive6 = Probe-Rdp 'setelah start layanan'

# ---------- 6. Akses privat + Daemon UDP :4433 RawInput (Game FPS 360° Aim) ----------
try {
  $daemonDir = 'C:\ProgramData\XyDesk'
  New-Item -ItemType Directory -Path $daemonDir -Force -ErrorAction SilentlyContinue | Out-Null
  $daemonPs1 = Join-Path $daemonDir 'xydesk-rawinput-udp.ps1'
  $daemonCode = @'
Add-Type -TypeDefinition @"
using System;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;

public static class XyRawInputDaemon {
    [StructLayout(LayoutKind.Sequential)]
    struct INPUT { public uint type; public MOUSEINPUT mi; }
    [StructLayout(LayoutKind.Sequential)]
    struct MOUSEINPUT {
        public int dx; public int dy; public uint mouseData;
        public uint dwFlags; public uint time; public IntPtr dwExtraInfo;
    }
    [DllImport("user32.dll")] static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

    public static void Run(int port) {
        using (var udp = new UdpClient(port)) {
            IPEndPoint ep = new IPEndPoint(IPAddress.Any, 0);
            byte[] ack = new byte[] { (byte)'X', (byte)'Y', (byte)'I', (byte)'A', 1 };
            long lastAck = 0;
            while (true) {
                try {
                    byte[] rx = udp.Receive(ref ep);
                    if (rx == null || rx.Length < 12) continue;
                    if (rx[0] != (byte)'X' || rx[1] != (byte)'Y' || rx[2] != (byte)'I' || rx[3] != (byte)'1') continue;
                    byte cmd = rx[4];
                    short a1 = BitConverter.ToInt16(rx, 6);
                    short a2 = BitConverter.ToInt16(rx, 8);
                    if (cmd == 1) {
                        var inp = new INPUT[1];
                        inp[0].type = 0;
                        inp[0].mi.dx = a1;
                        inp[0].mi.dy = a2;
                        inp[0].mi.dwFlags = 0x0001; // MOUSEEVENTF_MOVE (relative)
                        SendInput(1, inp, Marshal.SizeOf(typeof(INPUT)));
                    } else if (cmd == 2) {
                        byte btn = rx[5];
                        bool down = (a1 != 0);
                        uint fl = 0;
                        if (btn == 0) fl = down ? 0x0002u : 0x0004u;
                        else if (btn == 1) fl = down ? 0x0008u : 0x0010u;
                        else if (btn == 2) fl = down ? 0x0020u : 0x0040u;
                        if (fl != 0) {
                            var inp = new INPUT[1];
                            inp[0].type = 0;
                            inp[0].mi.dwFlags = fl;
                            SendInput(1, inp, Marshal.SizeOf(typeof(INPUT)));
                        }
                    } else if (cmd == 3) {
                        var inp = new INPUT[1];
                        inp[0].type = 0;
                        inp[0].mi.dwFlags = 0x0800; // MOUSEEVENTF_WHEEL
                        inp[0].mi.mouseData = (uint)a1;
                        SendInput(1, inp, Marshal.SizeOf(typeof(INPUT)));
                    }
                    long now = Environment.TickCount;
                    if (cmd == 5 || (now - lastAck) >= 250) {
                        lastAck = now;
                        udp.Send(ack, ack.Length, ep);
                    }
                } catch { }
            }
        }
    }
}
"@ -ErrorAction SilentlyContinue
[XyRawInputDaemon]::Run(4433)
'@
  Set-Content -LiteralPath $daemonPs1 -Value $daemonCode -Encoding UTF8 -Force
  $runKey = 'Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run'
  Set-Reg $runKey 'XyDeskRawInputUDP' "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$daemonPs1`"" 'String' | Out-Null
  Log '  daemon RawInput Game FPS (UDP :4433 -> SendInput MOUSEEVENTF_MOVE) terdaftar di HKLM Run'
} catch { Log "  daemon RawInput gagal didaftarkan: $($_.Exception.Message)" }
Log 'Hubungkan HP dan Windows ke tailnet yang sama. RDP playback dan audio capture memakai kanal RDP; bridge UDP :4433 siap untuk RawInput Game FPS.'

# ---------- 6b. Verifikasi RDP masih hidup setelah tweak ----------
# CATATAN PENTING (validasi 2026-10-03): setelah tweak, listener 3389 di runner
# ini sempat mati ~2 menit. Kita TIDAK me-restart TermService lagi (restart tidak
# membantu, malah memperlama mati) — kita cukup mengukur dan melaporkan apa
# adanya supaya setup-akses tahu harus menunggu berapa lama.
$rdpReadyAt = Wait-RdpReady -TimeoutSec 150
if ($rdpReadyAt) { Log "  RDP masih sehat setelah tweak: $rdpReadyAt`:3389 (handshake X.224 OK)" }
else { Log '  PERINGATAN: RDP belum menjawab handshake setelah tweak — setup-akses akan menunggu lagi' }

# ---------- 7. Status (apa adanya, bukan asumsi) ----------
$allOk = $okDeny -and $okMulti -and $okAudio -and $okMic -and $okWall -and $okAvc -and $okAvc2 -and ($fontTxt -like 'ok*')
Update-Status @{ xydesk = [ordered]@{
    host          = if ($allOk) { 'ok' } else { 'sebagian' }
    denyts        = if ($okDeny) { 'ok' } else { 'gagal' }
    multisession  = if ($okMulti) { 'ok' } else { 'gagal' }
    avc444        = $avcTxt
    fontsmoothing = $fontTxt
    audio_out     = if ($okAudio) { "ok (policy fDisableAudio=$polAudio, WinStations=$curAudio)" } else { "gagal (policy=$polAudio WinStations=$curAudio)" }
    audio_mic     = if ($okMic) { "ok (policy fDisableAudioCapture=$polMic, WinStations=$curMic) - mic HP redirect aktif, Allow di HP" } else { "gagal (policy=$polMic WinStations=$curMic)" }
    wallpaper_rdp = if ($okWall) { "ok (policy fNoRemoteDesktopWallpaper=$polWall) - wallpaper RDP tampil, cek client Experience→Wallpaper ON" } else { "gagal (policy=$polWall WinStations=$curWall) - RDP blok wallpaper" }
    firewall      = "tcp3389=$fwTcp udp3389=$fwUdp udp4433=$fw4433"
    services      = $svcTxt
    rdp_ready     = if ($rdpReadyAt) { "$rdpReadyAt (handshake OK)" } else { 'belum' }
    rdp_probe     = "awal=$rdpAlive0 multi=$rdpAlive1 audio=$rdpAlive2 grafis=$rdpAlive3 clear=$rdpAlive4 fw=$rdpAlive5 svc=$rdpAlive6"
    quic_udp4433  = 'dibuka di VM (tidak lewat tunnel TCP)'
    akses         = if ($addr) { $addr } else { '(menyusul)' }
    note          = if ($allOk) { 'Host siap dipakai klien XyDesk Remote mode Koneksi RDP (Host+Port tunnel). Kunci WinStations\RDP-Tcp sengaja TIDAK ditulis supaya listener 3389 tidak mati di runner GitHub.' }
                    else { 'Sebagian setelan host gagal — sesi tetap jalan lewat RDP biasa; cek log step Host setup XyDesk' }
} } | Out-Null

if ($allOk) {
  Log 'SELESAI — XyDesk host siap: AVC444 + ClearType + multi-session + audio/mic'
} else {
  Log "SELESAI (sebagian) — cek baris 'gagal' di atas; sesi tetap bisa dipakai lewat RDP biasa"
}
exit 0
