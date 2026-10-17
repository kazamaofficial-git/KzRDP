# Portmap access (workflow schema 5)

Credit: Kazama Tech. Updated 2026-10-12.

OpenVPN runs on the Windows runner only. Clients use the public mapping hostname and allocated TCP port with an RDP client. This is public RDP exposure, not a private tailnet.

## Per-repository setup

1. Each owner creates their own Portmap configuration and TCP mapping to local Windows port 3389.
2. Store the entire inline OpenVPN configuration as Actions Secret `PORTMAP_OVPN_CONFIG`. Never commit it, print it or copy the owner's configuration to other people's forks.
3. Set `RDP_PASSWORD` separately. Use a strong unique password and save the optional encrypted dashboard copy if password reveal is needed.
4. Dashboard Settings: `akses=portmap`, `portmap_host` and `portmap_port`. Secrets required by Setup depend on the selected access mode.
5. Manual Actions dispatch accepts the same inputs. Repo variables `PORTMAP_HOST`/`PORTMAP_PORT` are fallback values when the manual inputs are blank. Variables/secrets are not an automatic fork onboarding mechanism.
6. Authorize the target repository in the GitHub App installation and select it in dashboard Connection.

## Security and behavior

The .ovpn profile is validated against supported directives, requires inline CA/client certificate/key plus server-certificate verification, and disallows executable hooks. Local config directory ACL is limited to SYSTEM and Administrators. OpenVPN is downloaded from the official stable distribution and its Authenticode publisher/signature checked. Route pulling is disabled to avoid changing the runner's default route; the process must report Initialization Sequence Completed before proceeding. RDP requires an existing listener; NLA/TLS are enforced and a TCP 3389 firewall rule is scoped to an active OpenVPN adapter. Finalization stops only the recorded OpenVPN executable, removes the local private configuration and the dedicated firewall rule. Logs never intentionally print the configuration or password.

Portmap connection status means the VPN and local listener were prepared. It does not prove public ingress, actual RDP client compatibility, sound/microphone or latency. Provider account limits, mapping correctness and Allowed IPs must still permit the user.


## Community join and domains

A join-channel/group link can be part of onboarding, but clicking it is not verified membership and cannot make repository secrets inherit across forks. Never distribute one user's Portmap private key to other fork owners.

Portmap's managed custom-domain feature is advertised in its paid plan. A plain DNS-only hostname alias is a separate DNS mechanism: it does not remove the allocated port, provision an RDP certificate, provide proxying, or reduce latency. No domain record was changed in this setup.

