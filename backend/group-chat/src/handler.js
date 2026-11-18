"use strict";

const { randomUUID } = require("node:crypto");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
} = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = process.env.GROUP_CHAT_TABLE;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}

function getUser(event) {
  const user = event.requestContext?.authorizer?.lambda;
  if (!user || typeof user.userId !== "string" || !user.userId) {
    throw new HttpError(401, "Authentication is required.");
  }
  return user;
}

function parseBody(body) {
  if (typeof body !== "string") {
    throw new HttpError(400, "A JSON request body is required.");
  }
  try {
    const value = JSON.parse(body);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Body must be an object.");
    }
    return value;
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

function getGroupId(event) {
  const groupId = event.pathParameters?.groupId;
  if (typeof groupId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(groupId)) {
    throw new HttpError(400, "A valid group ID is required.");
  }
  return groupId;
}

function getPageSize(value) {
  if (value === undefined) return DEFAULT_PAGE_SIZE;
  const size = Number(value);
  if (!Number.isInteger(size) || size < 1 || size > MAX_PAGE_SIZE) {
    throw new HttpError(400, `limit must be an integer between 1 and ${MAX_PAGE_SIZE}.`);
  }
  return size;
}

function encodeCursor(key) {
  return key ? Buffer.from(JSON.stringify(key)).toString("base64url") : null;
}

function decodeCursor(cursor, groupId) {
  if (!cursor) return undefined;
  if (typeof cursor !== "string" || cursor.length > 2048) {
    throw new HttpError(400, "Invalid pagination cursor.");
  }
  try {
    const key = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (
      key?.PK !== `GROUP#${groupId}` ||
      typeof key?.SK !== "string" ||
      !key.SK.startsWith("MESSAGE#")
    ) {
      throw new Error("Cursor key does not match the group.");
    }
    return key;
  } catch {
    throw new HttpError(400, "Invalid pagination cursor.");
  }
}

function getDisplayName(user) {
  const name = user.name.trim();
  if (name) return name;
  return user.email || "Group member";
}

async function getMembership(groupId, userId, client, tableName) {
  const result = await client.send(new GetCommand({
    TableName: tableName,
    Key: { PK: `GROUP#${groupId}`, SK: `MEMBER#${userId}` },
    ConsistentRead: true,
  }));
  if (!result.Item) throw new HttpError(403, "You are not a member of this group.");
  return result.Item;
}

function membershipItem(groupId, groupName, userId, role, joinedAt) {
  return {
    PK: `GROUP#${groupId}`,
    SK: `MEMBER#${userId}`,
    GSI1PK: `USER#${userId}`,
    GSI1SK: `GROUP#${groupId}`,
    groupId,
    groupName,
    userId,
    role,
    joinedAt,
  };
}

async function listGroups(user, client, tableName) {
  const result = await client.send(new QueryCommand({
    TableName: tableName,
    IndexName: "UserGroupsIndex",
    KeyConditionExpression: "GSI1PK = :userKey",
    ExpressionAttributeValues: { ":userKey": `USER#${user.userId}` },
    Limit: MAX_PAGE_SIZE,
  }));
  return jsonResponse(200, {
    groups: (result.Items || []).map((item) => ({
      groupId: item.groupId,
      name: item.groupName,
      role: item.role,
      joinedAt: item.joinedAt,
    })),
  });
}

async function createGroup(user, body, client, tableName) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 60) {
    throw new HttpError(400, "Group name must be between 1 and 60 characters.");
  }

  const groupId = randomUUID();
  const createdAt = new Date().toISOString();
  const group = {
    PK: `GROUP#${groupId}`,
    SK: "META",
    groupId,
    name,
    ownerUserId: user.userId,
    createdAt,
  };

  await client.send(new TransactWriteCommand({
    TransactItems: [
      {
        Put: {
          TableName: tableName,
          Item: group,
          ConditionExpression: "attribute_not_exists(PK)",
        },
      },
      {
        Put: {
          TableName: tableName,
          Item: membershipItem(groupId, name, user.userId, "owner", createdAt),
          ConditionExpression: "attribute_not_exists(PK)",
        },
      },
    ],
  }));

  return jsonResponse(201, {
    group: { groupId, name, role: "owner", createdAt },
  });
}

async function addMember(user, groupId, body, client, tableName) {
  const memberUserId = typeof body.userId === "string" ? body.userId.trim() : "";
  if (!memberUserId || memberUserId.length > 128) {
    throw new HttpError(400, "A valid Firebase user ID is required.");
  }
  if (memberUserId === user.userId) {
    throw new HttpError(400, "You are already a member of this group.");
  }

  const owner = await getMembership(groupId, user.userId, client, tableName);
  if (owner.role !== "owner") {
    throw new HttpError(403, "Only the group owner can add members.");
  }

  const joinedAt = new Date().toISOString();
  try {
    await client.send(new PutCommand({
      TableName: tableName,
      Item: membershipItem(groupId, owner.groupName, memberUserId, "member", joinedAt),
      ConditionExpression: "attribute_not_exists(PK)",
    }));
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      throw new HttpError(409, "That user is already a member of this group.");
    }
    throw error;
  }

  return jsonResponse(201, { member: { userId: memberUserId, role: "member", joinedAt } });
}

async function listMessages(user, event, client, tableName) {
  const groupId = getGroupId(event);
  await getMembership(groupId, user.userId, client, tableName);

  const query = event.queryStringParameters || {};
  const cursor = decodeCursor(query.cursor, groupId);
  const result = await client.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "PK = :groupKey AND begins_with(SK, :messagePrefix)",
    ExpressionAttributeValues: {
      ":groupKey": `GROUP#${groupId}`,
      ":messagePrefix": "MESSAGE#",
    },
    Limit: getPageSize(query.limit),
    ScanIndexForward: false,
    ...(cursor ? { ExclusiveStartKey: cursor } : {}),
  }));

  const messages = (result.Items || []).map((item) => ({
    messageId: item.messageId,
    userId: item.userId,
    firstName: item.firstName,
    lastName: item.lastName,
    text: item.text,
    sentTime: item.sentTime,
  })).reverse();

  return jsonResponse(200, {
    messages,
    nextCursor: encodeCursor(result.LastEvaluatedKey),
  });
}

async function sendMessage(user, event, body, client, tableName) {
  const groupId = getGroupId(event);
  await getMembership(groupId, user.userId, client, tableName);

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 1000) {
    throw new HttpError(400, "Message text must be between 1 and 1000 characters.");
  }

  const displayName = getDisplayName(user).split(/\s+/);
  const sentTime = new Date().toISOString();
  const message = {
    PK: `GROUP#${groupId}`,
    SK: `MESSAGE#${sentTime}#${randomUUID()}`,
    messageId: randomUUID(),
    groupId,
    userId: user.userId,
    firstName: displayName[0],
    lastName: displayName.slice(1).join(" "),
    text,
    sentTime,
  };

  await client.send(new PutCommand({
    TableName: tableName,
    Item: message,
    ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
  }));

  const { PK, SK, ...publicMessage } = message;
  return jsonResponse(201, { message: publicMessage });
}

async function routeRequest(event, client = dynamo, tableName = TABLE_NAME) {
  const user = getUser(event);
  const method = event.requestContext?.http?.method;
  const routeKey = event.routeKey;

  if (routeKey === "GET /groups" && method === "GET") {
    return listGroups(user, client, tableName);
  }
  if (routeKey === "POST /groups" && method === "POST") {
    return createGroup(user, parseBody(event.body), client, tableName);
  }
  if (routeKey === "POST /groups/{groupId}/members" && method === "POST") {
    return addMember(user, getGroupId(event), parseBody(event.body), client, tableName);
  }
  if (routeKey === "GET /groups/{groupId}/messages" && method === "GET") {
    return listMessages(user, event, client, tableName);
  }
  if (routeKey === "POST /groups/{groupId}/messages" && method === "POST") {
    return sendMessage(user, event, parseBody(event.body), client, tableName);
  }

  throw new HttpError(404, "Route not found.");
}

async function handler(event) {
  if (!TABLE_NAME) {
    console.error("GROUP_CHAT_TABLE is not configured.");
    return jsonResponse(500, { error: "Group chat service is not configured." });
  }

  try {
    return await routeRequest(event);
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(error.statusCode, { error: error.message });
    }

    console.error("Group chat request failed:", error);
    return jsonResponse(500, { error: "The group chat request could not be completed." });
  }
}

module.exports = {
  handler,
  _test: {
    decodeCursor,
    encodeCursor,
    getPageSize,
    getGroupId,
    parseBody,
    membershipItem,
    routeRequest,
    HttpError,
  },
};
