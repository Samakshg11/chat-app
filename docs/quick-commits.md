# Chat API Notes

## Endpoints

- All endpoints accept optional `Authorization: Bearer <jwt>` and will use token user identity when present.
- `POST /api/chat/send`: sends a message and creates thread if missing. Returns `201 Created`.
  - If authenticated, `sender` is inferred from token and does not need to be sent in body.
  - Response now includes `receiverOnline` to help clients decide immediate notification UX.
- `GET /api/chat/threads/:userId?page=1&limit=20`: paginated threads for a user with `unreadCount` per thread.
  - `:userId` can be omitted logically by passing any valid ID when authenticated; token user is used as actor.
- `GET /api/chat/threads/me?page=1&limit=20`: authenticated shortcut for own threads.
- `GET /api/chat/:threadId?page=1&limit=20&order=desc`: paginated messages for a thread.
  - Supports `markAsRead=true|1|yes` (optional, with `userId` or token identity) to mark fetched unread messages as read.
  - `order` must be `asc` or `desc`.
- Pagination responses include `page`, `limit`, `count`, `total`, `totalPages`, and `hasMore`.
- `PATCH /api/chat/thread/:threadId/read`: marks thread messages as read for `userId`.
  - Accepts `userId` in body for legacy clients, or token identity for authenticated clients.
  - Returns `404` if the thread does not exist.
- `PATCH /api/chat/thread/:threadId/read/me`: authenticated shortcut for marking own read state.

## Socket Events

- `join(userId | { userId })`: registers online user mapping.
  - Invalid user payload emits `join:error` with `{ message }`.
- `presence:snapshot`: one-time event sent on connect with current `{ onlineCount, onlineUserIds }`.
- `leave()`: removes online user mapping before socket disconnect.
- `newMessage`: delivered to all active receiver sockets.
- `threadRead`: delivered to all active sender sockets only when unread messages were actually transitioned to read.
- `presence:update`: broadcast with `{ onlineCount, onlineUserIds }` on join/leave/disconnect.

## Commit message guidelines

- Use imperative mood: "Add", "Fix", "Update".
- Keep messages concise and focused on one change.
- Reference files or issues when helpful.

Example: `Add README with quick start` or `Fix error formatting in error.middleware.js`.
