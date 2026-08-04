# 🔌 API & Socket.IO Documentation - SyncWrite Collab

This document outlines the REST API endpoints and Socket.IO real-time WebSocket event protocol for SyncWrite Collab.

Base API URL: `http://localhost:3000/api`

---

## 🔒 Authentication & Headers

All protected endpoints require authorization via one of the following methods:
1. **HTTP-Only Cookie**: `accessToken=<token>`
2. **Authorization Header**: `Authorization: Bearer <accessToken>`

---

## 1. 🔑 Authentication Endpoints (`/api/auth`)

### 1.1 Register New User
- **Route**: `POST /api/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123!"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "accessToken": "<jwt-token>",
    "refreshToken": "<jwt-token>",
    "user": {
      "_id": "64d...",
      "name": "John Doe",
      "email": "john@example.com",
      "authProvider": "local"
    }
  }
  ```

### 1.2 Login User
- **Route**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "Password123!"
  }
  ```
- **Response** (`200 OK`): Return JWT access/refresh tokens, set HTTP-only cookies, and user JSON profile.

### 1.3 Google OAuth Authentication
- **Route**: `POST /api/auth/google`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "idToken": "<google-oauth-id-token>"
  }
  ```
- **Response** (`200 OK`): Verifies Google token on backend, creates/links user profile, and returns auth response.

### 1.4 Silent Token Refresh
- **Route**: `POST /api/auth/refresh`
- **Access**: Public (requires valid `refreshToken`)
- **Request Body** *(Optional if sent via cookie)*:
  ```json
  {
    "refreshToken": "<jwt-refresh-token>"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "accessToken": "<new-access-token>"
  }
  ```

### 1.5 Get Current User Profile
- **Route**: `GET /api/auth/me`
- **Access**: Private (`protect`)
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "user": { ... }
  }
  ```

### 1.6 Logout User
- **Route**: `POST /api/auth/logout`
- **Access**: Private (`protect`)
- **Response** (`200 OK`): Clears `accessToken` and `refreshToken` cookies.

---

## 2. 📄 Document Endpoints (`/api/documents`)

### 2.1 Create Document
- **Route**: `POST /api/documents`
- **Access**: Private (`protect`)
- **Request Body**:
  ```json
  {
    "title": "Project Proposal"
  }
  ```
- **Response** (`201 Created`): Returns newly created document instance.

### 2.2 Get Accessible Documents (Owned & Shared)
- **Route**: `GET /api/documents?search=<query>`
- **Access**: Private (`protect`)
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "all": [ ... ],
    "owned": [ ... ],
    "shared": [ ... ]
  }
  ```

### 2.3 Get Document Details by ID
- **Route**: `GET /api/documents/:id`
- **Access**: Private (`requireDocAccess('viewer')`)
- **Response** (`200 OK`): Returns document details and `userAccessLevel` (`'owner'`, `'editor'`, `'commenter'`, `'viewer'`).

### 2.4 Update Document Content / Title via REST
- **Route**: `PUT /api/documents/:id`
- **Access**: Private (`requireDocAccess('editor')`)
- **Request Body**:
  ```json
  {
    "title": "Updated Title",
    "content": "<p>Updated HTML content</p>"
  }
  ```

### 2.5 Rename Document
- **Route**: `PATCH /api/documents/:id/rename`
- **Access**: Private (`requireDocAccess('editor')`)
- **Request Body**: `{ "title": "New Document Name" }`

### 2.6 Duplicate Document
- **Route**: `POST /api/documents/:id/duplicate`
- **Access**: Private (`requireDocAccess('viewer')`)
- **Response** (`201 Created`): Creates a copy of document owned by requesting user.

### 2.7 Share Document / Update Permissions
- **Route**: `POST /api/documents/:id/share`
- **Access**: Private (`requireDocAccess('editor')`)
- **Request Body**:
  ```json
  {
    "email": "collaborator@example.com",
    "role": "editor",
    "isPublic": true,
    "publicRole": "viewer"
  }
  ```

### 2.8 Remove Collaborator Access
- **Route**: `DELETE /api/documents/:id/share/:targetUserId`
- **Access**: Private (`requireDocAccess('owner')`)

### 2.9 Delete Document
- **Route**: `DELETE /api/documents/:id`
- **Access**: Private (`requireDocAccess('owner')`)

---

## 3. 📜 Version History & Revisions (`/api/documents/:docId/revisions`)

### 3.1 Create Manual Revision Snapshot
- **Route**: `POST /api/documents/:docId/revisions`
- **Access**: Private (`requireDocAccess('editor')`)
- **Request Body**: `{ "versionName": "Milestone v1.0" }`

### 3.2 Get Document Revision History
- **Route**: `GET /api/documents/:docId/revisions`
- **Access**: Private (`requireDocAccess('viewer')`)

### 3.3 Restore Document to Revision
- **Route**: `POST /api/documents/:docId/revisions/:revisionId/restore`
- **Access**: Private (`requireDocAccess('editor')`)

---

## 4. 💬 Comments & Discussions (`/api/documents/:docId/comments`)

### 4.1 Add Comment Thread
- **Route**: `POST /api/documents/:docId/comments`
- **Access**: Private (`requireDocAccess('commenter')`)
- **Request Body**: `{ "content": "Please review this paragraph." }`

### 4.2 Get Document Comments
- **Route**: `GET /api/documents/:docId/comments`
- **Access**: Private (`requireDocAccess('viewer')`)

### 4.3 Edit Comment
- **Route**: `PUT /api/documents/:docId/comments/:commentId`
- **Access**: Private (`Comment Author only`)

### 4.4 Add Reply to Comment Thread
- **Route**: `POST /api/documents/:docId/comments/:commentId/reply`
- **Access**: Private (`requireDocAccess('commenter')`)

### 4.5 Toggle Resolve / Reopen Comment
- **Route**: `PATCH /api/documents/:docId/comments/:commentId/resolve`
- **Access**: Private (`requireDocAccess('commenter')`)

### 4.6 Delete Comment / Reply
- **Route**: `DELETE /api/documents/:docId/comments/:commentId` (Comment Author / Doc Owner)
- **Route**: `DELETE /api/documents/:docId/comments/:commentId/replies/:replyId` (Reply Author / Doc Owner)

---

## ⚡ 5. Socket.IO Real-Time Protocol

Socket Endpoint: `ws://localhost:3000`

### Authentication Handshake
Pass JWT token via handshake `auth.token` or cookies:
```js
const socket = io("http://localhost:3000", {
  auth: { token: "<access-token>" },
  withCredentials: true,
});
```

### Client -> Server Events

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `join-document` | `{ documentId }` | Subscribes socket to room `document:<id>` and initializes room presence |
| `send-changes` | `{ documentId, delta, content, title }` | Broadcasts document changes to collaborators in real-time |
| `cursor-move` | `{ documentId, cursor, selection }` | Transmits collaborator cursor position & text selection |
| `typing` | `{ documentId, isTyping }` | Transmits active typing state |
| `save-document` | `{ documentId, content, title }` | Auto-saves document content to MongoDB & evaluates revision snapshots |
| `comment-action` | `{ documentId }` | Triggers comment thread update notifications |
| `leave-document` | — | Unsubscribes from document room and cleans up presence state |

### Server -> Client Events

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `receive-changes` | `{ delta, content, title }` | Emitted when a collaborator edits content or title |
| `presence-update` | `Array<CollaboratorPresence>` | Updated list of connected collaborators in document room |
| `user-joined` | `CollaboratorPresence` | Emitted when a new collaborator joins room |
| `user-left` | `{ socketId, userId, name }` | Emitted when a collaborator disconnects or leaves room |
| `cursor-update` | `{ socketId, userId, name, cursor, selection }` | Updated live cursor position of a collaborator |
| `user-typing` | `{ userId, name, isTyping }` | Emitted when a user starts/stops typing |
| `save-success` | `{ savedAt, lastModifiedBy, title, message }` | Confirms successful auto-save |
| `save-error` | `{ message }` | Sent if save operation fails or user lacks permission |
| `comment-updated` | — | Signals collaborators to refresh comments thread |
