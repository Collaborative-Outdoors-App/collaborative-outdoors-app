"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { handler } = require("../src/authorizer");

test("Firebase authorizer denies missing and malformed bearer tokens", async () => {
  process.env.FIREBASE_PROJECT_ID = "test-project";
  assert.deepEqual(await handler({ headers: {} }), { isAuthorized: false });
  assert.deepEqual(
    await handler({ headers: { authorization: "not-a-bearer-token" } }),
    { isAuthorized: false },
  );
});
