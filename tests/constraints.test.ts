import assert from "node:assert/strict";

import {
  getMediaRequirementMessage,
  hasRequiredMedia,
  validatePost,
} from "../src/lib/platforms/constraints";

const image = { type: "IMAGE" as const, mimeType: "image/jpeg", sizeBytes: 1024 };

const xOverLimit = validatePost("X", "x".repeat(281));
assert.equal(xOverLimit.valid, false);
assert.deepEqual(xOverLimit.errors, ["Over 280 character limit by 1"]);

assert.equal(getMediaRequirementMessage("INSTAGRAM"), "INSTAGRAM requires an image");
assert.equal(getMediaRequirementMessage("TIKTOK"), "TIKTOK requires a video");
assert.equal(getMediaRequirementMessage("X"), null);

assert.equal(hasRequiredMedia("INSTAGRAM", []), false);
assert.equal(hasRequiredMedia("INSTAGRAM", [image]), true);
assert.equal(hasRequiredMedia("TIKTOK", [image]), false);

const instagramWithoutImage = validatePost("INSTAGRAM", "A photo update");
assert.equal(instagramWithoutImage.valid, false);
assert.deepEqual(instagramWithoutImage.errors, ["INSTAGRAM requires an image"]);

const instagramWithImage = validatePost("INSTAGRAM", "A photo update", [image]);
assert.equal(instagramWithImage.valid, true);

console.log("Platform constraint tests passed.");
