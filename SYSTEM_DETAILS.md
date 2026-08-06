# System Details

This document describes how SyncWrite Collab behaves at runtime and how the major components coordinate.

## 1. Runtime setup

The application is organized around two execution contexts:

- a browser runtime for the React user interface
- a Node.js runtime for the HTTP API and Socket.IO server

The frontend and backend are intentionally kept separate so document editing, authorization, and collaboration can scale independently.

## 2. Request lifecycle

### Authentication

Users authenticate through the server API. The backend validates credentials and returns JWT tokens that the client stores locally. Protected routes use `protect` middleware to ensure requests are authenticated.

### Document retrieval

When a user opens a document, the client calls the document detail API. The server loads the document, resolves the current user’s effective role, and returns both the document payload and access level.

### Permission-aware rendering

The client then decides how to render the editor:

- `owner` and `editor` users receive editable content
- `viewer` receives read-only UI
- other roles receive role-specific interaction constraints

## 3. Collaboration engine

The collaboration engine is implemented in `server/src/sockets/docHandler.js` and wired through `server/src/sockets/socketManager.js`.

### Socket authentication

The server validates the handshake token on connection. If it is missing or invalid, the socket is rejected. Once accepted, the socket stores the authenticated user object and is allowed to join document rooms.

### Room model

Each document is represented by its own Socket.IO room with the name pattern:

```text
document:<documentId>
```

When a user joins the room, the server:

- adds the user to the document presence map
- broadcasts the updated presence list
- sends the current live room content to the newly joined client if it exists in memory

### Live events

Main collaborative events currently in use:

- `join-document`
- `send-changes`
- `typing`
- `cursor-move`
- `save-document`
- `leave-document` / room disconnect cleanup

## 4. Save and revision behavior

The document save path is hybrid:

- content is emitted live through Socket.IO to collaborators
- the database is updated through the server-side `save-document` event
- revision snapshots are created according to thresholds and content-change heuristics

The current revision logic:

- always creates an initial revision when none exists
- creates a periodic snapshot after a long editing window
- creates a major-change snapshot if content differs significantly after enough elapsed time

## 5. Data structures

### Document structure

The document model stores:

- `title`
- `content`
- `owner`
- `collaborators`
- `pendingInvites`
- `isPublic`
- `publicRole`
- `lastModifiedBy`
- timestamps

### Collaborator structure

A collaborator entry is embedded as:

- `user` reference
- `role` (`viewer`, `commenter`, `editor`)

### Pending invite structure

A pending invite stores:

- `email`
- `role`

This lets invited users receive access once they claim the document through registration or sign-in.

## 6. Client-side behavior

The main editor page coordinates several responsibilities:

- initialize the TipTap editor with document-specific extensions
- detect local user edits and emit collaboration events
- show save state feedback
- render avatars and typing indicators
- manage comments, history, and share side panels
- support export to PDF, Word, and Markdown

The editor uses a local `saveStatus` state so the user sees whether content is currently being saved or has been persisted.

## 7. Frontend service layering

The frontend is intentionally separated into:

- pages – page-level composition
- context – global state such as auth and socket life cycle
- features – editor-specific UI blocks and toolbars
- services – REST communication wrappers
- components – shared UI elements

This allows the editor page to stay focused on document editing while the rest of the codebase handles reusable infrastructure.

## 8. Error and resilience behavior

The system currently emphasizes practical resilience through:

- Socket reconnection attempts in the client
- fallback REST save behavior when the socket layer is unavailable
- permission verification on every protected document route
- non-blocking sharing email dispatch
- in-memory live room cache to support rapid join behavior

## 9. Implementation summary

In practical terms, the system behaves like this:

1. The user opens a document through the dashboard.
2. The backend confirms the user’s access level.
3. The client establishes a live socket connection and joins the document room.
4. Typing and document updates are broadcast immediately to collaborators.
5. The server saves the updated state to MongoDB and records revision history.
6. The user sees save status and presence feedback in real time.

That combination makes the project a document collaboration application with real-time edit propagation, role-aware access, and persistent version tracking.

