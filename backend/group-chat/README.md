# Group chat API

This AWS SAM service provides Firebase-authenticated group membership and chat using API Gateway HTTP API, Lambda, and DynamoDB. Group data is stored in one DynamoDB table; messages are ordered by server timestamp and message ID.

## Routes

All routes require `Authorization: Bearer <Firebase ID token>`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/groups` | List groups for the signed-in Firebase user |
| `POST` | `/groups` | Create a group; the caller becomes its owner |
| `POST` | `/groups/{groupId}/members` | Add a Firebase user ID; group owner only |
| `GET` | `/groups/{groupId}/messages?limit=50&cursor=...` | List the caller's group messages |
| `POST` | `/groups/{groupId}/messages` | Send `{ "text": "..." }` as the signed-in user |

Messages are limited to 1,000 characters, and list page size is limited to 100. The API derives the sender ID and display name from the verified Firebase token; clients cannot choose a sender identity. Membership is checked on every message operation.

## Deploy

Prerequisites: AWS CLI configured with a deployment role, AWS SAM CLI, Node.js 22+, and a Firebase project ID. The deployment identity needs permission to create the stack resources and upload the SAM package to S3.

From this directory:

```powershell
npm install
npm test
$env:PATH = "$(Get-Location)\node_modules\.bin;$env:PATH"
& 'C:\Program Files\Amazon\AWSSAMCLI\bin\sam.cmd' build
& 'C:\Program Files\Amazon\AWSSAMCLI\bin\sam.cmd' deploy --guided
```

The PATH addition lets SAM find the local esbuild binary on Windows. If SAM CLI is already on PATH, you can use `sam build` and `sam deploy --guided` instead.

During guided deployment:

1. Choose the AWS region for the API, Lambdas, and DynamoDB table.
2. Provide `FirebaseProjectId` as the Firebase project ID (not a Firebase API key).
3. Set `AllowedOrigins` to the exact app origins, comma-separated. For local Expo web, include `http://localhost:8081`; add the production web origin before release.
4. Allow SAM to create the deployment role and save the stack settings if desired.
5. After deployment, copy the `GroupChatApiUrl` output. This is the API base URL; do not append credentials or AWS key/value assignments to it.

SAM creates the DynamoDB table and GSI, enables point-in-time recovery and encryption, configures API Gateway CORS, and grants the chat Lambda access to that table. There is no need to manually put credentials in the app or Lambda environment.

## Smoke test

Obtain a Firebase ID token for a signed-in test user, then use it as a bearer token. Do not put the token in source control or share it.

```powershell
$api = "https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com"
$headers = @{ Authorization = "Bearer YOUR_FIREBASE_ID_TOKEN" }
$group = Invoke-RestMethod -Method Post -Uri "$api/groups" -Headers $headers -ContentType "application/json" -Body '{"name":"Test hikers"}'
$groupId = $group.group.groupId
Invoke-RestMethod -Method Post -Uri "$api/groups/$groupId/messages" -Headers $headers -ContentType "application/json" -Body '{"text":"Hello from the group chat"}'
Invoke-RestMethod -Method Get -Uri "$api/groups/$groupId/messages" -Headers $headers
```

To add another participant, call `POST /groups/{groupId}/members` as the owner with `{"userId":"FIREBASE_UID_OF_MEMBER"}`. In a production invitation flow, resolve and verify the invitee before adding their Firebase UID; do not accept a client-supplied UID as proof of identity.

## DynamoDB layout

The table uses `PK` / `SK` as its primary key and `GSI1PK` / `GSI1SK` for listing a user's groups:

- Group metadata: `PK=GROUP#{groupId}`, `SK=META`
- Membership: `PK=GROUP#{groupId}`, `SK=MEMBER#{userId}`, `GSI1PK=USER#{userId}`, `GSI1SK=GROUP#{groupId}`
- Message: `PK=GROUP#{groupId}`, `SK=MESSAGE#{sentTime}#{messageId}`

## Connect the mobile app

The React Native screens call the AWS service through `src/services/groupChatService.js`. After deployment, add this to the app's local `.env`:

```env
EXPO_PUBLIC_GROUP_CHAT_API_URL=https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com
```

Restart Expo after changing `.env`. When this variable is present, the Groups screen loads and creates groups through AWS, and the Group Chat screen loads and sends messages through API Gateway using the signed-in Firebase user's ID token. Without it, the existing device-local behavior remains available.

The existing demo groups (`g1`, `g2`) are not imported into DynamoDB. Create a new group while connected to AWS before opening its chat. Use **Refresh chat** to load messages sent by other group members. The current group-management UI does not yet sync invitations by email, role changes, member removal, or group deletion. The API supports adding a member by Firebase user ID through `POST /groups/{groupId}/members`; a trusted invitation flow and corresponding UI integration are still needed. Itineraries also remain device-local, although sharing an itinerary to chat posts a normal AWS-backed message.
