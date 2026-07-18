# ConnectX — Real-Time Chat Application

ConnectX is a full-stack real-time chat platform built with the MERN stack, Socket.IO, and Redis. It supports one-to-one and group messaging, rich message features, friend requests, real-time notifications, global search, and per-user chat organization.

> **Note on privacy:** A chat between two users is only allowed once a friend request has been accepted. User profiles are viewable via a profile modal (with Add Friend / Block actions). Friends appear in a dedicated Friends list and are excluded from global search.

---

## Tech Stack

| Layer    | Technology                                                                 |
| -------- | -------------------------------------------------------------------------- |
| Frontend | React 18, Vite, Redux Toolkit, Tailwind CSS, Framer Motion, Socket.IO client |
| Backend  | Node.js, Express, Socket.IO, MongoDB (Mongoose), Redis (Upstash), Zod       |
| Storage  | Cloudinary (images / video / audio / files), local `uploads/` for streaming |
| Tooling  | ESLint, Prettier, Docker / docker-compose, GitHub Actions CI               |

---

## Features

### Messaging
- One-to-one and group chats
- Real-time delivery via Socket.IO (`message:new`, `typing`, presence)
- Reactions, reply, edit (with "edited" tag), soft-delete
- Forward to another chat, pin (per chat), bookmark (per user), copy
- Markdown + rich text rendering
- Emoji picker

### Groups
- Create groups with avatar and description
- Admin roles, promote/demote admins, add/remove members

### Friends & Privacy
- Send / accept / reject / cancel friend requests
- Block / unblock users (blocked users are hidden from search and DMs)
- Friends list (accepted friends only); non-friends cannot start a chat
- Profile modal for viewing other users

### Search & Organization
- Global search across users, messages, files, and groups
- Recent searches (per user, persisted)
- Pinned / Favorite / Muted per-user chat flags
- Chat list filters (All / Pinned / Favorites / Archived)

### Notifications
- Real-time notifications (`notification:new` socket event)
- Per-chat and total unread badges
- Browser / desktop notifications when the tab is hidden
- Mark-as-read and clear controls

### Media
- Image / video / file / audio attachments via Cloudinary
- Voice messages (record, waveform player, download)

---

## Project Structure

```
.
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/chat # Sidebar, ChatWindow, MessageInput, MessageBubble, modals…
│   │   ├── pages/          # Dashboard
│   │   ├── redux/          # chat / friend / auth slices + store
│   │   ├── services/       # api + socket clients
│   │   └── hooks/          # useSocketEvents
│   └── .env.example
├── server/                 # Express + Socket.IO backend
│   ├── src/
│   │   ├── controllers/    # auth, chat, message, user, friend, notification, upload
│   │   ├── models/         # User, Chat, Message, ChatSettings, Notification, FriendRequest
│   │   ├── routes/         # mounted REST routes
│   │   ├── services/       # cloudinary, redis, email, notification
│   │   ├── sockets/        # Socket.IO event handlers
│   │   ├── validators/     # Zod request validators
│   │   └── config/         # env, db, redis
│   └── .env.example
├── .github/workflows/ci.yml
├── docker-compose.yml
└── package.json            # npm workspaces root
```

---

## Prerequisites

- Node.js **>= 20**
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A Redis instance (TLS-enabled [Upstash](https://upstash.com) recommended)
- A Cloudinary account (media storage)
- (Optional) An SMTP provider for email verification / password reset

---

## Getting Started

### 1. Clone & install

```bash
git clone <your-repo-url>
cd connectx
npm install
```

### 2. Configure environment

Copy the example env files and fill in your own values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

#### `server/.env`

| Variable                 | Description                                              |
| ------------------------ | -------------------------------------------------------- |
| `NODE_ENV`               | `development` / `production`                             |
| `PORT`                   | Backend port (default `5000`)                            |
| `CLIENT_URL`             | Frontend URL (e.g. `http://localhost:5173`)              |
| `MONGODB_URI`            | MongoDB connection string                                |
| `REDIS_URL`              | Redis URL — use `rediss://` for TLS (Upstash)            |
| `JWT_ACCESS_SECRET`      | Secret for access tokens                                 |
| `JWT_REFRESH_SECRET`     | Secret for refresh tokens                                |
| `JWT_ACCESS_EXPIRES`     | Access token TTL (e.g. `15m`)                            |
| `JWT_REFRESH_EXPIRES_DAYS` | Refresh token TTL in days                             |
| `COOKIE_SECURE`          | `true` in production (HTTPS)                             |
| `CLOUDINARY_*`           | Cloud name / API key / API secret                        |
| `SMTP_*`                 | Mail server credentials                                  |
| `SENTRY_DSN`             | (Optional) Sentry DSN                                     |
| `LOG_LEVEL`              | `info` / `debug` / `warn`                                |

#### `client/.env`

| Variable           | Description                       |
| ------------------ | --------------------------------- |
| `VITE_API_URL`     | Backend API base URL              |
| `VITE_SOCKET_URL`  | Backend Socket.IO URL             |

> **Never commit your real `.env` files.** They are git-ignored. Only `.env.example` templates are tracked.

### 3. Run (development)

```bash
npm run dev
```

This starts the client (Vite, port 5173) and server (Express + Socket.IO, port 5000) concurrently.

### 4. Build

```bash
npm run build      # builds the client into client/dist
```

---

## Scripts

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Run client + server in watch mode            |
| `npm run build`      | Build the client                             |
| `npm run lint`       | Lint all workspaces                          |
| `npm run format`     | Format with Prettier                         |
| `npm run format:check` | Verify formatting                          |
| `npm run test`       | Run tests (per workspace)                    |

---

## Docker

A `docker-compose.yml` is provided for local containerized runs:

```bash
docker compose up --build
```

---

## API Overview

Base path: `/api`

| Area          | Routes                                                        |
| ------------- | ------------------------------------------------------------- |
| Auth          | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password` |
| Chats         | `/chats`, `/chats/group/*`, `/chats/search`, `/chats/settings` |
| Messages      | `/messages`, `/messages/:id/*` (react, pin, bookmark, edit, forward, read) |
| Users         | `/users` (search), `/users/:id` (profile)                    |
| Friends       | `/friends`, `/friends/sent`, `/friends/friends`, `/friends/blocked` |
| Notifications | `/notifications`, `/notifications/unread`, `/notifications/read` |
| Upload        | `/upload` (multipart → Cloudinary)                           |

Real-time events are delivered over Socket.IO (e.g. `message:new`, `message:updated`, `typing:start`, `notification:new`, `friend:request`, `presence:update`).

---

## Security

- Helmet + CORS + rate limiting
- Zod validation on all inputs
- Bcrypt-hashed passwords with login lockout
- JWT access + refresh token rotation (httpOnly cookies)
- Secrets loaded from environment only; `.env` is git-ignored

---

## License

This project is provided as-is for educational and personal use.
