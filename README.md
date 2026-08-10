# Chat-app

Minimal chat API built with Express and Socket.io.

Quick start:

1. Copy `.env.example` to `.env` and configure.
2. Install deps: `npm install`
3. Start dev server: `npm run dev`

Minimal chat application using Express and Socket.io.

Getting started

- Install dependencies: `npm install`
- Start in development: `npm run dev`
- Start in production: `npm start`

Quick API overview

- `GET /api/chat/threads/:userId?` - list user's threads with pagination
- `POST /api/chat/send` - send a message (body: `sender`, `receiver`, `message`)
- `GET /api/chat/:threadId` - list messages in a thread with `page`, `limit`, `order`
- `PATCH /api/chat/thread/:threadId/read` - mark messages as read for a user

Health endpoints

- `GET /health`, `GET /live`, `GET /ready` - basic service health checks

Where to look

- Server entry: `server.js`
- App setup: `src/app.js`
- Socket handling: `socket/socket.js`
- Routes: `routes/`
- Controllers: `src/controllers/`

This repository contains minimal scaffolding for local development.

Development

- Run syntax checks: `npm run check:syntax`
- Run in dev mode with auto-reload: `npm run dev`
- Environment variables are loaded from `.env` at startup. Ensure `MONGO_URI` is set before running.

Tests

- Run basic project tests: `npm test` (executes scripts under `test/` which are lightweight node scripts)

- Run an individual test: `node test/messageValidator.test.js`

Contributing

- Contributions are welcome. Please open a pull request with a clear description of the change and a short, focused commit message. Run tests locally before opening a PR.

If you'd like help setting up an automated CI workflow, open an issue describing your CI provider.