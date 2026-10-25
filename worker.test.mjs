// Run: node worker.test.mjs
import assert from "node:assert/strict";
import worker from "./worker.js";

const pkg = (id, ipkUrl = "https://x/a.ipk") => ({
  id,
  manifestUrl: "https://x/manifest.json",
  manifest: { ipkUrl, ipkHash: { sha256: "abc" } },
  fullDescriptionUrl: `apps/${id}/full_description.html`,
});

globalThis.fetch = async () =>
  Response.json({
    packages: [
      pkg("org.webosbrew.hbchannel"),
      pkg("com.not.allowed"),
      pkg("ooo.lew.lifesgoodwithoutspying", "http://insecure/a.ipk"),
    ],
  });

const res = await worker.fetch(new Request("https://w/apps.json"));
const body = await res.json();
assert.deepEqual(body.packages.map((p) => p.id), ["org.webosbrew.hbchannel"]);
assert.equal(body.paging.itemsTotal, 1);
assert.equal(body.packages[0].manifest.ipkHash.sha256, "abc");
assert.equal(
  body.packages[0].fullDescriptionUrl,
  "https://repo.webosbrew.org/api/apps/org.webosbrew.hbchannel/full_description.html",
);
assert.equal((await worker.fetch(new Request("https://w/"))).status, 404);
console.log("ok");
