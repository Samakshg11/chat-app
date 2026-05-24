# Chat API Notes

## Endpoints

- `POST /api/chat/send`: sends a message and creates thread if missing. Returns `201 Created`.
- `GET /api/chat/threads/:userId?page=1&limit=20`: paginated threads for a user with `unreadCount` per thread.
- `GET /api/chat/:threadId?page=1&limit=20&order=desc`: paginated messages for a thread.
  - Supports `markAsRead=true|1|yes` (optional, with `userId`) to mark fetched unread messages as read.
  - `order` must be `asc` or `desc`.
- Pagination responses include `page`, `limit`, `count`, `total`, `totalPages`, and `hasMore`.
- `PATCH /api/chat/thread/:threadId/read`: marks thread messages as read for `userId`.
  - Returns `404` if the thread does not exist.

## Socket Events

- `join(userId)`: registers online user mapping.
- `leave()`: removes online user mapping before socket disconnect.
- `newMessage`: delivered to online receiver socket.
- `threadRead`: delivered to senders only when unread messages were actually transitioned to read.
- `presence:update`: broadcast with `{ onlineCount, onlineUserIds }` on join/leave/disconnect.
