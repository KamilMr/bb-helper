import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import {
  getMergeConfirmationError,
  mergePullRequest,
} from "../build/services/bitbucket.js";
import { shouldPromptForMergeConfirmation } from "../build/commands/pr/merge.js";

test("accepts only the exact pull request ID", () => {
  assert.equal(getMergeConfirmationError(42, "42"), null);

  for (const confirmation of [undefined, "", "042", "42 ", " 42", "41"]) {
    assert.match(getMergeConfirmationError(42, confirmation), /not merged|not merge/i);
  }
});

test("always uses the prompt flow in an interactive non-JSON session", () => {
  assert.equal(shouldPromptForMergeConfirmation(false, true), true);
  assert.equal(shouldPromptForMergeConfirmation(true, true), false);
  assert.equal(shouldPromptForMergeConfirmation(false, false), false);
});

test("rejects missing or mismatched non-interactive confirmation", () => {
  const cli = new URL("../build/cli.js", import.meta.url);

  for (const extraArgs of [["--json"], ["--json", "--confirm-id=41"]]) {
    const result = spawnSync(
      process.execPath,
      [cli.pathname, "pr", "merge", "workspace", "repo", "42", ...extraArgs],
      { encoding: "utf8", env: { ...process.env, BB_EMAIL: "", BB_TOKEN: "" } },
    );

    assert.equal(result.status, 1);
    assert.match(result.stdout, /not merged/i);
  }
});

test("blocks the merge request before contacting Bitbucket on a mismatch", async () => {
  let fetchCalled = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    fetchCalled = true;
    throw new Error("Unexpected network request");
  };

  try {
    await assert.rejects(
      mergePullRequest({
        workspace: "workspace",
        repoSlug: "repo",
        pullRequestId: 42,
        confirmation: "41",
      }),
      /does not exactly match/,
    );
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("preserves merge options after exact confirmation", async () => {
  const originalFetch = globalThis.fetch;
  const originalEmail = process.env.BB_EMAIL;
  const originalToken = process.env.BB_TOKEN;
  let request;

  process.env.BB_EMAIL = "test@example.com";
  process.env.BB_TOKEN = "test-token";
  globalThis.fetch = async (url, options) => {
    request = { url: String(url), options };
    return new Response(JSON.stringify({ id: 42 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await mergePullRequest({
      workspace: "workspace",
      repoSlug: "repo",
      pullRequestId: 42,
      confirmation: "42",
      strategy: "squash",
      message: "Merge safely",
      closeSourceBranch: true,
    });

    assert.match(request.url, /\/pullrequests\/42\/merge$/);
    assert.equal(request.options.method, "POST");
    assert.deepEqual(JSON.parse(request.options.body), {
      message: "Merge safely",
      merge_strategy: "squash",
      close_source_branch: true,
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalEmail === undefined) delete process.env.BB_EMAIL;
    else process.env.BB_EMAIL = originalEmail;
    if (originalToken === undefined) delete process.env.BB_TOKEN;
    else process.env.BB_TOKEN = originalToken;
  }
});
