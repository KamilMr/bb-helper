import assert from "node:assert/strict";
import test from "node:test";
import { listPullRequests } from "../build/services/bitbucket.js";

const withBitbucketAuth = async operation => {
  const originalEmail = process.env.BB_EMAIL;
  const originalToken = process.env.BB_TOKEN;

  process.env.BB_EMAIL = "test@example.com";
  process.env.BB_TOKEN = "test-token";

  try {
    await operation();
  } finally {
    if (originalEmail === undefined) delete process.env.BB_EMAIL;
    else process.env.BB_EMAIL = originalEmail;
    if (originalToken === undefined) delete process.env.BB_TOKEN;
    else process.env.BB_TOKEN = originalToken;
  }
};

test("requests the supported maximum PR page length", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl;

  globalThis.fetch = async url => {
    requestedUrl = String(url);
    return new Response(JSON.stringify({
      size: 0,
      page: 1,
      pagelen: 50,
      values: [],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    await withBitbucketAuth(() => listPullRequests("workspace", "repo", "OPEN"));
    assert.equal(
      requestedUrl,
      "https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests?pagelen=50&state=OPEN",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("follows Bitbucket next links and combines every PR page", async () => {
  const originalFetch = globalThis.fetch;
  const requestedUrls = [];

  globalThis.fetch = async url => {
    requestedUrls.push(String(url));

    const response = requestedUrls.length === 1
      ? {
          size: 2,
          page: 1,
          pagelen: 50,
          next: "https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests?page=2&pagelen=50",
          values: [{ id: 1 }],
        }
      : {
          size: 2,
          page: 2,
          pagelen: 50,
          values: [{ id: 2 }],
        };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await withBitbucketAuth(async () => {
      const result = await listPullRequests("workspace", "repo");
      assert.deepEqual(result.values.map(pr => pr.id), [1, 2]);
      assert.deepEqual(requestedUrls, [
        "https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests?pagelen=50",
        "https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests?page=2&pagelen=50",
      ]);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
