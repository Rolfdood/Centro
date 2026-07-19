import assert from "node:assert/strict";

const xAccount = { id: "account-x", platform: "X" as const };
const linkedInAccount = { id: "account-linkedin", platform: "LINKEDIN" as const };

const storage = new Map<string, string>();

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  },
});

async function run(): Promise<void> {
  const { useComposerStore } = await import("../src/stores/composerStore");
  const initialKey = useComposerStore.getState().idempotencyKey;
  useComposerStore.getState().beginNewDraft();

  assert.match(useComposerStore.getState().idempotencyKey, /^[0-9a-f-]{36}$/i);
  assert.notEqual(useComposerStore.getState().idempotencyKey, initialKey);

  useComposerStore.getState().setBaseText("Centro is ready to publish.");
  useComposerStore.getState().selectAccount(xAccount);
  useComposerStore.getState().selectAccount(linkedInAccount);

  assert.deepEqual(useComposerStore.getState().selectedAccountIds, [
    xAccount.id,
    linkedInAccount.id,
  ]);
  assert.equal(
    useComposerStore.getState().variants[xAccount.id]?.adaptedText,
    "Centro is ready to publish.",
  );

  useComposerStore.getState().setBaseText("Centro is ready for every channel.");
  assert.equal(
    useComposerStore.getState().variants[xAccount.id]?.adaptedText,
    "Centro is ready for every channel.",
  );

  useComposerStore.getState().setVariantText(xAccount.id, "A concise X post.");
  useComposerStore.getState().setBaseText("Centro ships another update.");

  assert.deepEqual(useComposerStore.getState().variants[xAccount.id], {
    accountId: xAccount.id,
    platform: "X",
    adaptedText: "A concise X post.",
    isManuallyEdited: true,
    isAiGenerated: false,
  });
  assert.equal(
    useComposerStore.getState().variants[linkedInAccount.id]?.adaptedText,
    "Centro ships another update.",
  );

  useComposerStore.getState().deselectAccount(xAccount.id);
  assert.deepEqual(useComposerStore.getState().selectedAccountIds, [
    linkedInAccount.id,
  ]);
  assert.equal(useComposerStore.getState().variants[xAccount.id], undefined);

  console.log("Composer store tests passed.");
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
