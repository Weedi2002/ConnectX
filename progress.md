# ConnectX – Progress Tracker

**Last updated:** Phase 2 - Jobs & Queue (BullMQ) complete

**Status legend:** `[ ]` pending · `[~]` in progress · `[x]` done

---

## Phase 0 — Project Setup ✅
- [x] Initialize monorepo (client / server) — npm workspaces
- [x] Vite + React + Tailwind setup
- [x] Express + Socket.IO server bootstrap
- [x] MongoDB Atlas connection (Mongoose)
- [x] Redis (Upstash) connection (ioredis)
- [x] Environment config + validation (zod)
- [x] Docker + docker-compose (local dev: mongo + redis)
- [x] ESLint + Prettier
- [x] GitHub Actions CI (lint, test, build)
- [x] Sentry + logging (Pino)

---

## Phase 1 — MVP ✅

### Authentication
- [x] Registration
- [x] Login
- [x] JWT access tokens
- [x] Refresh token rotation (httpOnly cookies)
- [x] Email verification
- [x] Forgot / reset password
- [x] Change password
- [x] Account lockout / brute-force protection

### User Profiles
- [x] Avatar upload (Cloudinary)
- [x] Username / Bio / Status
- [x] Last seen / Online status
- [x] Theme preference

### Real-Time Messaging (1-to-1)
- [x] Socket.IO + Redis adapter
- [x] One-to-one chat
- [x] Instant delivery
- [x] Message synchronization
- [x] Offline queue (persisted messages fetched on join)
- [x] Typing indicators
- [x] Read receipts (sent/delivered/read)
- [x] Online presence

### Media Sharing
- [x] Multer memory storage → Cloudinary stream
- [x] File type + size validation
- [x] Image/video preview
- [x] Download files
- [x] Image compression / optimization (sharp)

### Performance
- [x] Infinite scroll
- [x] Message pagination
- [x] DB indexes (chatId + createdAt, text search)

### UI/UX
- [x] Dashboard + sidebar
- [x] Dark/light theme
- [x] Skeleton loaders
- [x] Toast notifications

---

## Phase 2

### Group Chats ✅
- [x] Create group
- [x] Group avatar
- [x] Admin roles / promote admin
- [x] Invite / remove members
- [x] Group description

### Message Features ✅
- [x] Reactions (add/toggle per user)
- [x] Reply (replyTo, rendered in bubble + input preview)
- [x] Edit (sender only, "edited" tag) + soft-delete
- [x] Forward (copy to another chat, forwardedFrom)
- [x] Pin (per-chat pinned bar + list) / Bookmark (per-user list) / Copy
- [x] Rich text + Markdown (react-markdown + remark-gfm)
- [x] Emoji picker (emoji-picker-react) in input + reactions

### Search & Organization ✅
- [x] Global search (users / messages / files / groups) — `/api/chats/search?q=&type=`
- [x] Recent searches (per-user, persisted on User, max 10) + clear
- [x] Pinned / Favorite / Muted per-user chat flags (ChatSettings model)
- [x] Chat list filters (All / Pinned / Fav / Archived), pinned sorted first
- [x] Mute toggle (GroupInfoPanel + ChatWindow), pin/favorite toggles in ChatWindow header
- [x] Files search (messages with attachments)

### Notifications ✅
- [x] Real-time notifications (`notification:new` socket event) for messages, group add/update/leave, pin
- [x] `Notification` model + endpoints (`GET /notifications`, `GET /notifications/unread`, `PATCH /notifications/read[/:id]`, `DELETE /notifications`)
- [x] Desktop / browser notifications (Notification API, permission request, fire when tab hidden)
- [x] Unread counter + badge (per-chat `unreadByChat` derived from `message:new`, `NotificationsBell` total badge, `ChatList` per-chat badge)
- [x] Notifications panel (list, mark-all-read, clear, click-to-open chat)

### Friend Requests ✅
- [x] Send / Accept / Reject / Cancel friend requests (`/friends`, socket `friend:request`/`friend:accepted`)
- [x] Incoming / Sent / Blocked lists + unread badge in Sidebar
- [x] Blocked users (User.blocked) — excluded from user search + DM guard in `createOrGetChat`
- [x] FriendRequestsPanel (Incoming accept/reject, Sent cancel, Blocked unblock)
- [x] **UserProfileModal** — view other users' profiles (Add Friend / Block / Unblock only)
- [x] **Chat gated to friends**: `createOrGetChat` requires an `accepted` FriendRequest (non-friends get 403); clicking a search result opens the profile, not a chat
- [x] `GET /users/:id` profile endpoint (block-aware)
- [x] **Friends list** (`GET /friends/friends`): accepted friends shown only here, excluded from user search + pending-request users excluded too
- [x] FriendRequestsPanel adds a "Friends" tab (click to open chat)

### Voice Messages ✅
- [x] Hold-to-record mic (native MediaRecorder) in MessageInput
- [x] Waveform player (wavesurfer.js) with play/pause, progress, duration, download (`VoiceMessage.jsx`)
- [x] Uploads to Cloudinary; server upload allowlist extended with audio/wav, mp3, m4a, mp4, aac, flac
- [x] `MessageBubble` renders `type: 'audio'` attachments via `VoiceMessage`; client sets `type:'audio'`
- [x] Notifications auto-load on Dashboard mount (`fetchNotifications` thunk) + real-time via socket
- [x] Search excludes pending friend-request users; notifications panel positioning fixed (left-0)

### AI Assistant (Gemini) ✅
- [x] Gemini API integration (`@google/generative-ai`) — `gemini.service.js`, `GEMINI_API_KEY` + `GEMINI_MODEL` env (default `gemini-2.5-flash`; configurable)
- [x] Note: `gemini-1.5-flash` is NOT available for the project key (404 on Google), so default switched to `gemini-2.5-flash` (free-tier, verified working)
- [x] Smart replies (`POST /api/ai/smart-reply`) — suggests 3 replies; rendered as chips in `MessageInput`
- [x] Conversation summarization (`POST /api/ai/summarize`) — summary modal in `ChatWindow`
- [x] Message translation (`POST /api/ai/translate`) — per-message "Translate" in `MessageBubble`, inline translated text toggle
- [x] Graceful errors: 503 (no key), 429 (quota), friendly 502 on other failures; auth + chat-membership guards on all AI routes

### Jobs & Queue (BullMQ) ✅
- [x] `bullmq` dependency added; dedicated Redis connection (`queues/connection.js`, `maxRetriesPerRequest: null`)
- [x] Queue bootstrap (`queues/index.js`) — `initQueues`/`closeQueues`, wired into `server.js` (start + graceful shutdown)
- [x] **Email jobs** (`queues/email.queue.js`): `verification` + `reset-password` enqueued from `auth.controller`; worker sends via `email.service` (retry/backoff)
- [x] **Notification jobs** (`queues/notification.queue.js`): `notify()` enqueues; worker persists (`Notification.insertMany`) + emits `notification:new` via shared IO accessor (`sockets/realtime.js`)
- [x] **Media jobs** (`queues/media.queue.js`): image attachments enqueued after send; worker generates `sharp` thumbnail → Cloudinary `connectx/thumbnails` → patches message attachment `thumbnail`
- [x] `attachmentSchema.thumbnail` field added to `Message` model

---

## Phase 3 — Optional
- [ ] WebRTC 1-to-1 calls
- [ ] Screen sharing
- [ ] Group calls (SFU)
- [ ] Admin dashboard
- [ ] Analytics
- [ ] i18n / language support

---

## Security Checklist
- [x] Helmet (`app.js:helmet()`)
- [x] CORS (`app.js` + `sockets/index.js`, explicit origin, credentials)
- [x] Rate limiting (HTTP) — global 300/15min + auth 20/15min (`middleware/rateLimit.js`)
- [x] Rate limiting (per-socket) — `SocketRateLimiter` class (15 events/10s per user per event)
- [x] Input validation — Zod on all POST/PUT routes; `escapeRegex` on search queries
- [x] MongoDB injection protection — `express-mongo-sanitize` strips `$` keys; regex escape prevents ReDoS
- [x] XSS protection — Helmet headers + `xss` package sanitizes username/bio/status/message content/chat name/description (pre-save hooks)
- [x] Password hashing (bcryptjs, 12 rounds)
- [x] Socket.IO event authorization — membership checks on chat:join/typing/message:delivered/read

---

## Testing
- [ ] Backend unit tests (Jest)
- [ ] Backend integration tests (Supertest)
- [ ] Frontend tests (Vitest + RTL)
- [ ] E2E smoke tests

---

## Deployment
- [ ] Frontend → Vercel
- [ ] Backend → Render / Railway
- [ ] MongoDB Atlas (prod)
- [ ] Redis (Upstash prod)
- [ ] Cloudinary (prod)
- [ ] Environment secrets configured
- [ ] Swagger / OpenAPI docs published
