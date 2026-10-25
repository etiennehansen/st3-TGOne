// Curated Homebrew Channel repository: upstream webosbrew packages, filtered to ALLOW.
// Homebrew Channel polls this URL and offers updates when upstream ships a new version.
// The Worker only filters; manifests, ipk URLs and sha256 hashes pass through from upstream untouched.
const UPSTREAM = "https://repo.webosbrew.org/api/apps.json";

const ALLOW = new Set([
  "org.webosbrew.hbchannel", // Homebrew Channel itself, so it self-updates
  "ooo.lew.lifesgoodwithoutspying", // turns off ad delivery, ACR, always-on voice (root)
  "org.webosbrew.safeupdate", // firmware update that checks it won't remove root (root)
]);

const https = (u) => typeof u === "string" && u.startsWith("https://");

export default {
  async fetch(req) {
    if (new URL(req.url).pathname !== "/apps.json") {
      return new Response("Not found. Repository is at /apps.json\n", { status: 404 });
    }

    const up = await fetch(UPSTREAM, { cf: { cacheTtl: 3600, cacheEverything: true } });
    if (!up.ok) return new Response(`upstream ${up.status}\n`, { status: 502 });

    const { packages } = await up.json();
    const kept = packages
      .filter((p) => ALLOW.has(p.id) && https(p.manifestUrl) && https(p.manifest?.ipkUrl))
      // Upstream uses repo-relative description links; Homebrew Channel would resolve them against us.
      .map((p) => ({ ...p, fullDescriptionUrl: p.fullDescriptionUrl && new URL(p.fullDescriptionUrl, UPSTREAM).href }));

    return Response.json(
      {
        paging: { page: 1, count: kept.length, maxPage: 1, itemsTotal: kept.length, prevUrl: null, nextUrl: null },
        packages: kept,
      },
      { headers: { "cache-control": "public, max-age=3600" } },
    );
  },
};
