# 🚀 SyncWrite Collab - Real-Time Collaborative Document Editor

SyncWrite Collab is a modern, full-stack real-time collaborative document editing application inspired by Google Docs and Notion. Built with **React 19**, **TipTap**, **Node.js**, **Express 5**, **MongoDB**, and **Socket.IO**.

---

## ✨ Features

- **🔐 Robust Authentication & Security**:
  - Email/Password authentication with password strength validation.
  - Native Google OAuth 2.0 integration.
  - Dual-token authorization strategy (15-minute Access Token, 7-day Refresh Token stored in HTTP-Only cookies & local storage).
  - Silent token refresh interceptor with request queueing.

- **⚡ Real-Time Collaboration**:
  - Live document synchronization using Socket.IO rooms (`document:<id>`).
  - Active collaborator presence tracking with avatars and user details.
  - Live cursor and text selection position tracking.
  - Real-time typing status indicators.

- **✍️ Rich Text Editing**:
  - Powered by TipTap editor with support for typography, font size, custom text/highlight colors, alignment, lists, task checkboxes, code blocks, blockquotes.
  - Custom resizable images with upload and crop modal.
  - Interactive table creation and cell background styling.
  - Export document to **PDF** (`html2pdf.js`), **Word** (`.doc`), and **Markdown** (`.md`).

- **📜 Smart Version History & Revisions**:
  - Automatic initial document version snapshot.
  - Periodic 10-minute auto-save snapshots.
  - Intelligent structural edit detection (new images, tables, or >200 character changes after 3 minutes).
  - Session closing snapshot when collaborators leave the document.
  - One-click version restoration with automatic safeguard backup before rollback.

- **💬 Real-Time Comments & Discussion**:
  - Threaded comments with nested replies.
  - Resolve/reopen discussion thread state.
  - Instant Socket.IO event broadcasting for comment updates.

- **🛡️ Granular Access Control (RBAC)**:
  - Four permission roles: `owner`, `editor`, `commenter`, `viewer`.
  - Public link sharing settings with configurable default public role.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19, Vite, React Router v7
- **Editor**: TipTap (`@tiptap/react`, `@tiptap/starter-kit`, `tiptap-pagination-plus`)
- **Styling**: Tailwind CSS v4, Lucide React icons
- **Utilities**: Axios, Socket.IO Client, `@react-oauth/google`, `html2pdf.js`, `date-fns`

### Backend
- **Runtime & Framework**: Node.js, Express 5
- **Database**: MongoDB & Mongoose 9
- **Real-Time**: Socket.IO 4
- **Security & Auth**: `jsonwebtoken`, `bcrypt`, `google-auth-library`, `cookie-parser`, `cors`

---

## 🚀 Setup & Installation Instructions

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- **MongoDB** (Local instance or MongoDB Atlas cluster URI)

---

### 1. Clone & Project Directory
```bash
git clone <repository-url>
cd syncwrite_collab
```

---

### 2. Environment Variables Configuration

#### Backend (`server/.env`)
Create a `.env` file in the `server` directory:

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/syncwrite_collab
CLIENT_URL=http://localhost:5173

JWT_ACCESS_SECRET=your_jwt_access_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here

GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

#### Frontend (`client/.env`)
Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

---

### 3. Server Setup & Launch

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start development server with Nodemon
npm run dev
```
The server will start listening at `http://localhost:3000`.

---

### 4. Client Setup & Launch

Open a new terminal window:

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The client application will run at `http://localhost:5173`.

---

## 📚 Documentation Links

- [📁 Database Schema Documentation](./DATABASE_SCHEMA.md)
- [🔌 API & Socket.IO Event Documentation](./API_DOCUMENTATION.md)
