# LTV: de-telemetry an LG OLED65G1PUA (webOS 6)

Three layers, cheapest first. Do 1 and 2. Layer 3 is optional.

## 1. TV settings (2 minutes, no tools)

Menu names shift between firmware versions; search Settings if a path doesn't match.

- **All Settings > General > System > Additional Settings > Live Plus**: Off. This is ACR, the
  feature that fingerprints what is on screen, including HDMI inputs.
- **Additional Settings > Advertisement**: Limit AD Tracking On, Home Promotion Off, Content
  Recommendation Off.
- **Support > Privacy & Terms > User Agreements**: uncheck Viewing Information, Interest-Based
  Recommendation, Voice Information. Leave the base Terms of Use checked if you want apps.
- Don't sign in to an LG account unless you need one.

Settings rely on LG honoring them. Layer 2 enforces them.

## 2. DNS blocking (router / Pi-hole / AdGuard Home / NextDNS)

The TV's `/etc/hosts` is read-only without root, so block at the network.

- `blocklist.txt`: ads + ACR. Safe. Apps, store and updates keep working.
- `blocklist-aggressive.txt`: LG service platform, ThinQ, firmware updates. Each line says
  what breaks.

Once this repo is on GitHub, subscribe to the raw URL as an adlist. Your blocker
re-pulls it on its normal schedule, so editing the list updates every network using it.

Also: give the TV a static DHCP lease, and block outbound DNS (port 53/853) from the TV's IP
to anything except your resolver. Otherwise hard-coded DNS can bypass the list.

Verify from a machine on the same network:

```bash
python3 check.py --live
```

`LEAK` means that domain still resolves.

## 3. Root (optional, risky)

Root lets you kill telemetry daemons on the TV itself and install Homebrew Channel apps.
Before you try it:

- Check your firmware at https://cani.rootmy.tv. As of 2025, current firmware for webOS 5 to 9
  was patched against faultmanager-autoroot and DejaVuln.
- If it is rootable, **stop updating** (block `snu.lge.com`). The trade-off: no more LG
  security patches, ever. A rooted TV with unpatched firmware should go on an isolated VLAN.
- For apps alone, Developer Mode is enough, no root needed. See https://www.webosbrew.org/rooting.

### App updates: curated Homebrew repo (Cloudflare Worker)

`worker.js` serves a Homebrew Channel repository containing only the apps listed in `ALLOW`,
pulled live from repo.webosbrew.org (cached 1 hour). When upstream ships a new version,
Homebrew Channel offers the update. The Worker filters only: manifests, download URLs and
sha256 hashes come from upstream unchanged, and non-HTTPS packages are dropped.

```bash
npx wrangler@latest deploy
```

In Homebrew Channel > Settings, add `https://st3tg1.shansen-563.workers.dev/apps.json`
as a repository. To show only the curated apps, also turn off the default repository.
Edit `ALLOW` and redeploy to change the list. Test with `node worker.test.mjs`.

## Legal lever: CCPA

Blocking stops new collection. `ccpa-request.md` asks LG to opt you out of sale/sharing, tell
you what they have, and delete it. CCPA obligates LG, not you, so this request is the part
the law covers. GDPR doesn't apply to a California resident dealing with LG USA, but its
principle of minimal data is what layers 1 and 2 achieve.
