# Steward Backend Shim

Local development backend server with WebSocket support.

## Setup

```bash
cd server
npm install
npm run dev
```

Server runs on `http://localhost:8080`
WebSocket runs on `ws://localhost:8080/ws`

## Endpoints

### Posts
- `GET /api/posts` - List posts (supports ?platform=, ?status=, ?campaignId=)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post
- `PATCH /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/approve` - Approve post
- `POST /api/posts/:id/publish` - Publish post (creates publish job)

### Publish Jobs
- `GET /api/publish-jobs` - List jobs (supports ?organizationId=, ?status=)
- `GET /api/publish-jobs/:id` - Get single job
- `POST /api/publish-jobs` - Create job
- `PATCH /api/publish-jobs/:id` - Update job
- `POST /api/publish-jobs/:id/retry` - Retry failed job

### Autopilot
- `GET /api/autopilot` - Get settings
- `PUT /api/autopilot` - Update settings

### Organizations
- `GET /api/organizations/me` - Get current org
- `GET /api/organizations` - List organizations

## WebSocket Events

The server broadcasts these events:

- `post_created` - New post created
- `post_updated` - Post updated
- `post_published` - Post published
- `publish_job_updated` - Publish job status changed

Message format:
```json
{
  "type": "publish_job_updated",
  "data": { ...job }
}
```

## Job Lifecycle Simulation

When a publish job is created:
1. Status: `queued` (immediately)
2. After 2s: Status → `publishing`
3. After 4s: Status → `completed`

Each status change is broadcast via WebSocket.
