"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  GetCommand,
  PutCommand,
  TransactWriteCommand,
} = require("@aws-sdk/lib-dynamodb");
process.env.GROUP_CHAT_TABLE = "unit-test-group-chat";
const {
  handler,
  _test: {
    decodeCursor,
    encodeCursor,
    getGroupId,
    getPageSize,
    membershipItem,
    parseBody,
    routeRequest,
    HttpError,
  },
} = require("../src/handler");

const authenticatedUser = {
  userId: "firebase-user-1",
  email: "hiker@example.com",
  name: "Riley Hiker",
};

function request(routeKey, method, properties = {}) {
  return {
    routeKey,
    ...properties,
    requestContext: {
      http: { method },
      authorizer: { lambda: authenticatedUser },
    },
  };
}

test("chat routes require an authenticated API Gateway authorizer context", async () => {
  const response = await handler({
    routeKey: "GET /groups",
    requestContext: { http: { method: "GET" } },
  });
  assert.equal(response.statusCode, 401);
  assert.deepEqual(JSON.parse(response.body), { error: "Authentication is required." });
});

test("creating a group stores its owner membership atomically", async () => {
  let transaction;
  const client = {
    async send(command) {
      assert.ok(command instanceof TransactWriteCommand);
      transaction = command.input.TransactItems;
      return {};
    },
  };

  const response = await routeRequest(
    request("POST /groups", "POST", { body: '{"name":"Weekend hikers"}' }),
    client,
    "test-table",
  );
  const result = JSON.parse(response.body);
  assert.equal(response.statusCode, 201);
  assert.equal(result.group.name, "Weekend hikers");
  assert.equal(transaction.length, 2);
  assert.equal(transaction[1].Put.Item.userId, authenticatedUser.userId);
  assert.equal(transaction[1].Put.Item.role, "owner");
});

test("sending a message requires membership and derives sender from verified identity", async () => {
  let storedMessage;
  const client = {
    async send(command) {
      if (command instanceof GetCommand) {
        return {
          Item: membershipItem("group-1", "Weekend hikers", authenticatedUser.userId, "member", "now"),
        };
      }
      assert.ok(command instanceof PutCommand);
      storedMessage = command.input.Item;
      return {};
    },
  };

  const response = await routeRequest(
    request("POST /groups/{groupId}/messages", "POST", {
      pathParameters: { groupId: "group-1" },
      body: '{"text":"  Hello hikers  ","userId":"someone-else","firstName":"Imposter"}',
    }),
    client,
    "test-table",
  );
  const result = JSON.parse(response.body);

  assert.equal(response.statusCode, 201);
  assert.equal(result.message.userId, authenticatedUser.userId);
  assert.equal(result.message.firstName, "Riley");
  assert.equal(result.message.lastName, "Hiker");
  assert.equal(result.message.text, "Hello hikers");
  assert.equal(storedMessage.PK, "GROUP#group-1");
  assert.match(storedMessage.SK, /^MESSAGE#/);
});

test("non-members cannot read group messages", async () => {
  const client = { async send() { return {}; } };
  await assert.rejects(
    routeRequest(
      request("GET /groups/{groupId}/messages", "GET", {
        pathParameters: { groupId: "group-1" },
      }),
      client,
      "test-table",
    ),
    (error) => error.statusCode === 403,
  );
});

test("page size defaults and enforces the supported range", () => {
  assert.equal(getPageSize(undefined), 50);
  assert.equal(getPageSize("100"), 100);
  assert.throws(() => getPageSize("0"), HttpError);
  assert.throws(() => getPageSize("101"), HttpError);
  assert.throws(() => getPageSize("1.5"), HttpError);
});

test("group IDs reject unsupported path characters", () => {
  assert.equal(getGroupId({ pathParameters: { groupId: "hike_group-1" } }), "hike_group-1");
  assert.throws(() => getGroupId({ pathParameters: { groupId: "../other" } }), HttpError);
});

test("request bodies must be JSON objects", () => {
  assert.deepEqual(parseBody('{"name":"Weekend hikers"}'), { name: "Weekend hikers" });
  assert.throws(() => parseBody("{"), HttpError);
  assert.throws(() => parseBody("[]"), HttpError);
});

test("message cursors round-trip and are bound to their group", () => {
  const key = { PK: "GROUP#group-1", SK: "MESSAGE#2026-01-01T00:00:00.000Z#abc" };
  const cursor = encodeCursor(key);
  assert.deepEqual(decodeCursor(cursor, "group-1"), key);
  assert.throws(() => decodeCursor(cursor, "group-2"), HttpError);
  assert.throws(() => decodeCursor("not-json", "group-1"), HttpError);
});

test("membership records support user group lookup and group authorization", () => {
  const membership = membershipItem("group-1", "Weekend hikers", "user-1", "owner", "now");
  assert.equal(membership.PK, "GROUP#group-1");
  assert.equal(membership.SK, "MEMBER#user-1");
  assert.equal(membership.GSI1PK, "USER#user-1");
  assert.equal(membership.GSI1SK, "GROUP#group-1");
  assert.equal(membership.role, "owner");
});
