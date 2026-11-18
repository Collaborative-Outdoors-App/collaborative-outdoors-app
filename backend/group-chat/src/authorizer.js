"use strict";

const { createRemoteJWKSet, jwtVerify } = require("jose");

const FIREBASE_JWKS_URL = new URL(
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
);
const jwks = createRemoteJWKSet(FIREBASE_JWKS_URL);

function unauthorized() {
  return { isAuthorized: false };
}

async function handler(event) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const authorization = event.headers?.authorization || event.headers?.Authorization;
  const tokenMatch = typeof authorization === "string"
    ? authorization.match(/^Bearer\s+(\S+)$/i)
    : null;

  if (!projectId || !tokenMatch) {
    return unauthorized();
  }

  try {
    const { payload } = await jwtVerify(tokenMatch[1], jwks, {
      algorithms: ["RS256"],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
    });

    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      return unauthorized();
    }

    return {
      isAuthorized: true,
      context: {
        userId: payload.sub,
        email: typeof payload.email === "string" ? payload.email : "",
        name: typeof payload.name === "string" ? payload.name : "",
      },
    };
  } catch (error) {
    console.warn("Firebase token verification failed:", error.code || error.name);
    return unauthorized();
  }
}

module.exports = { handler };
