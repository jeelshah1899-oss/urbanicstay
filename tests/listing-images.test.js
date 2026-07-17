const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const expectedImageIds = [
  "6c920970-76ae-4be1-846b-666ca3a0c0fd",
  "99c44b0d-373f-49b9-b961-01c913fa7dbf",
  "ec4866ef-36c8-4c91-9558-1017b394aa31",
  "88f8f240-cfb4-47f9-8818-9c1ce1339bfd",
  "bca829f0-949a-4232-b017-4d9d3351e6ab",
  "f59a3c6f-f183-45ac-8cc3-31dce7e9b84a",
  "f3d39a66-cfea-48ee-93ee-d313e5ba7d32",
  "6f21c80b-c62d-44a1-b124-e547ec002ad1",
  "249bb188-aca4-483b-8865-519b92ff4a9c",
  "e1deaf4f-4edf-4fd1-a60d-e771e4ae3e7b",
  "0539c67c-1747-4fc8-8d14-b4aedf19dca2",
  "88ef0c4c-3587-4b8e-8a00-4382c912deac",
  "df000234-297e-41a4-a5e2-d55568dc98b5",
  "8b353376-594b-4db4-8add-7d6221eb49ef",
];

const expectedLabels = [
  "Living room - Photo 1",
  "Dining area - Photo 2",
  "Bedroom 3 - Photo 1",
  "Dining area - Photo 1",
  "Additional photos - Photo 1",
  "Living room - Photo 2",
  "Living room - Photo 3",
  "Full kitchen - Photo 1",
  "Full kitchen - Photo 2",
  "Full kitchen - Photo 3",
  "Bedroom 1 - Photo 1",
  "Bedroom 2 - Photo 1",
  "Full bathroom 2 - Photo 1",
  "Full bathroom 1 - Photo 1",
];

test("cozy-and-comfortable uses the current Airbnb photo set", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "public", "listings-data.js"),
    "utf8",
  );
  const context = { window: {} };
  vm.runInNewContext(source, context);

  const listing = context.window.URBANIC_LISTINGS.find(
    (item) => item.slug === "cozy-and-comfortable",
  );
  const actualImageIds = Array.from(listing.images, (image) => {
    const match = image.url.match(/original\/([^/.]+)\.jpeg/);
    return match && match[1];
  });

  assert.deepEqual(actualImageIds, expectedImageIds);
  assert.deepEqual(
    Array.from(listing.images, (image) => image.label),
    expectedLabels,
  );
});
