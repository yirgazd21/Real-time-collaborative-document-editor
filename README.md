# SyncWrite Collab

SyncWrite Collab is a full-stack collaborative document editor built for real-time co-authoring, permission-aware sharing, and revision tracking. The system combines a React + Vite client, an Express-based API, and a Socket.IO collaboration layer to provide a Google Docs-style editing experience with document-level access control.

## Project goal

The application lets users:

- create and manage rich-text documents
- share documents with collaborators
- edit content live with presence and typing awareness
- review revision history and restore previous versions
- export documents to PDF, Word, or Markdown

## Core architecture

The project is split into two main runtime parts:

- Client application in `client/`
  - React 19 frontend
  - TipTap rich-text editor
  - React Router navigation
  - Socket.IO client for live collaboration
  - REST API client for auth, document, comment, and revision flows

- Server application in `server/`
  - Express 5 HTTP server
  - Mongoose + MongoDB persistence
  - JWT authentication and access middleware
  - Socket.IO event handlers for room-based collaboration
  - Revision and document management services

## System flow

1. A user logs in through the client.
2. The client requests document data through the REST API.
3. The server resolves the document and applies role-based access filtering.
4. When the document is opened, the client joins a Socket.IO document room.
5. All typing, formatting, title changes, and save events are broadcast through that room.
6. The server stores the latest document state in MongoDB and creates revision snapshots based on timing and structural change rules.

## Main feature areas

### Authentication and authorization

- email/password login
- Google OAuth login
- JWT access token validation on protected API routes
- document-level role enforcement for `owner`, `editor`, `commenter`, and `viewer`
- public/private document sharing

### Collaboration layer

- document-specific Socket.IO rooms
- collaborator presence tracking
- typing indicators
- live document content broadcast to active participants
- room cleanup and last-user-leave revision snapshots

### Editor experience

- TipTap-based rich text editing
- headings, paragraph alignment, highlights, colors, lists, tables, images, and task items
- zoom support and export utilities
- read-only mode for lower-permission users

### Versioning and restore

- automatic initial revision creation
- periodic auto-save revision snapshots
- major-change revision creation when meaningful document structure changes occur
- restore from version history in the editor UI

## Repository structure

- `client/` – frontend source, pages, UI components, hooks, services, context
- `server/` – backend source, controllers, routes, middleware, models, sockets
- `ARCHITECTURE.md` – system-level design summary
- `SYSTEM_DETAILS.md` – implementation detail and runtime behavior

## Setup

### Prerequisites

- Node.js 18+
- npm
- MongoDB instance or Atlas connection

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

### Environment variables

Server `.env` example:

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/syncwrite_collab
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
GOOGLE_CLIENT_ID=your_google_client_id
```

Client `.env` example:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [SYSTEM_DETAILS.md](SYSTEM_DETAILS.md)

## Notes

This project is currently structured around a hybrid real-time editing model:

- REST for document CRUD, auth, and permission management
- WebSocket events for low-latency collaborative updates and presence
- MongoDB as the source of truth for persistent document and revision history

---


# NPM Packages (External Dependencies)

These are third-party libraries installed from the **NPM Registry** using:

```bash
npm install <package-name>
```

They provide reusable functionality without requiring custom implementations.

---

# 💻 Client Packages (`client/package.json`)

| Package | Purpose |
|----------|---------|
| **react** & **react-dom** | Core frontend library for building user interfaces and rendering components. |
| **react-router-dom** | Enables client-side routing for Single-Page Applications (SPA). |
| **vite** | Fast frontend build tool and development server. |
| **@tiptap/react** & **@tiptap/starter-kit** | Core TipTap rich-text editor framework. |
| **@tiptap/extension-color** | Adds text color formatting support. |
| **@tiptap/extension-highlight** | Enables text highlighting. |
| **@tiptap/extension-bullet-list** | Supports unordered (bullet) lists. |
| **@tiptap/extension-ordered-list** | Supports numbered lists. |
| **@tiptap/extension-link** | Adds hyperlink creation and editing. |
| **@tiptap/extension-placeholder** | Displays placeholder text when the editor is empty. |
| **@tiptap/extension-task-list** | Provides interactive task lists with checkboxes. |
| **@tiptap/extension-text-align** | Enables left, center, right, and justified text alignment. |
| **@tiptap/extension-underline** | Adds underline formatting support. |
| **tiptap-pagination-plus** | Provides Microsoft Word-style paginated document editing. |
| **socket.io-client** | Connects the client to the Socket.IO server for real-time collaboration. |
| **axios** | Performs HTTP requests to the backend REST API. |
| **@react-oauth/google** | Implements Google OAuth 2.0 authentication for user sign-in. |
| **tailwindcss** | Utility-first CSS framework for responsive UI styling. |
| **lucide-react** | Modern SVG icon library for React applications. |
| **html2pdf.js** | Exports editor content as PDF documents. |
| **date-fns** | Utility library for formatting and manipulating dates and timestamps. |

---

# 🖥️ Server Packages (`server/package.json`)

| Package | Purpose |
|----------|---------|
| **express** | Web application framework for building REST APIs and handling HTTP requests. |
| **mongoose** | Object Data Modeling (ODM) library for interacting with MongoDB Atlas. |
| **socket.io** | Server-side WebSocket library enabling real-time collaborative editing. |
| **jsonwebtoken** | Creates and verifies JWT Access Tokens and Refresh Tokens for authentication. |
| **bcrypt** | Securely hashes and verifies user passwords. |
| **google-auth-library** | Verifies Google OAuth ID tokens during authentication. |
| **nodemailer** | Sends emails via SMTP for password reset links and document sharing invitations. |
| **cookie-parser** | Parses cookies included in incoming HTTP requests. |
| **cors** | Enables Cross-Origin Resource Sharing (CORS) between frontend and backend applications. |
| **dotenv** | Loads environment variables from a `.env` file into the application. |
| **nodemon** | Automatically restarts the server during development when source files change. |

