import assert from "node:assert/strict";

import { createUploadRouteHandlers } from "../src/lib/uploads/route-handlers";
import { uploadResponseSchema } from "../src/lib/validations/upload";

async function run(): Promise<void> {
  const savedUploads: Array<{ bytes: Uint8Array; mimeType: string }> = [];
  const handlers = createUploadRouteHandlers({
    getAuthenticatedUser: async () => ({ ok: true, userId: "user-1" }),
    storage: {
      save: async (input) => {
        savedUploads.push(input);
        return { fileName: "123e4567-e89b-12d3-a456-426614174000.png" };
      },
      load: async () => ({ bytes: new Uint8Array([1, 2, 3]), mimeType: "image/png" }),
    },
  });

  const formData = new FormData();
  formData.set("file", new File(["image data"], "image.png", { type: "image/png" }));
  const created = await handlers.POST(new Request("https://centro.local/api/uploads", {
    method: "POST",
    body: formData,
  }));
  assert.equal(created.status, 201);
  const body = await created.json();
  assert.equal(uploadResponseSchema.safeParse(body).success, true);
  assert.equal(body.media.url, "https://centro.local/api/uploads/123e4567-e89b-12d3-a456-426614174000.png");
  assert.equal(savedUploads[0]?.mimeType, "image/png");
  assert.equal(savedUploads[0]?.bytes.byteLength, 10);

  const invalidFormData = new FormData();
  invalidFormData.set("file", new File(["file"], "file.txt", { type: "text/plain" }));
  const invalid = await handlers.POST(new Request("https://centro.local/api/uploads", {
    method: "POST",
    body: invalidFormData,
  }));
  assert.equal(invalid.status, 400);

  const loaded = await handlers.GET(new Request("https://centro.local"), "123e4567-e89b-12d3-a456-426614174000.png");
  assert.equal(loaded.status, 200);
  assert.equal(loaded.headers.get("Content-Type"), "image/png");
  assert.deepEqual(new Uint8Array(await loaded.arrayBuffer()), new Uint8Array([1, 2, 3]));

  console.log("Upload API tests passed.");
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
