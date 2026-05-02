# Chat API Notes

## Endpoints

- `POST /api/chat/send`: sends a message and creates thread if missing.
- `GET /api/chat/threads/:userId?page=1&limit=20`: paginated threads for a user.
- `GET /api/chat/:threadId?page=1&limit=20&order=desc`: paginated messages for a thread.
- `PATCH /api/chat/thread/:threadId/read`: marks thread messages as read for `userId`.

## Socket Events

- `join(userId)`: registers online user mapping.
- `leave()`: removes online user mapping before socket disconnect.
- `newMessage`: delivered to online receiver socket.
- `threadRead`: delivered to senders when receiver marks thread as read.
- `presence:update`: broadcast with `{ onlineCount }` on join/leave/disconnect.
