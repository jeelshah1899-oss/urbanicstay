const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const hiddenSlugs = [
  "spacious-4bhk-apartment-near-airport",
  "2bhk-near-international-airport",
  "3bhk-apartment-mumbai",
  "spacious-house-andheri-west-3bhk",
];

test("requested listings are marked hidden", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "public", "listings-data.js"),
    "utf8",
  );
  const context = { window: {} };

  vm.runInNewContext(source, context);

  for (const slug of hiddenSlugs) {
    const listing = context.window.URBANIC_LISTINGS.find(
      (item) => item.slug === slug,
    );
    assert.ok(listing, `Expected listing data for ${slug}`);
    assert.equal(listing.hidden, true, `Expected ${slug} to be hidden`);
  }
});
