# 🗄️ Database Schema Documentation - SyncWrite Collab

This document describes the MongoDB database schemas, data models, field types, validation rules, indexes, and relationships implemented via Mongoose for SyncWrite Collab.

---

## 📐 Entity Relationship Model Overview

```
 ┌─────────────────┐           1:N          ┌─────────────────┐
 │      User       │ ──────────────────────> │    Document     │
 └─────────────────┘                        └─────────────────┘
          ▲                                          │
          │ 1:N                                      │ 1:N
          │                                          ▼
 ┌─────────────────┐                        ┌─────────────────┐
 │     Comment     │ <───────────────────── │    Revision     │
 └─────────────────┘          1:N           └─────────────────┘
```

---

## 1. 👤 User Schema (`users` collection)

Defined in [`server/src/models/User.js`](file:///home/yirgazd/Documents/insa/projects/syncwrite_collab/server/src/models/User.js).

### Field Definitions

| Field Name | Type | Required | Unique | Default | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Yes | Auto | Unique user identifier |
| `name` | `String` | **Yes** | No | — | User's full display name (trimmed) |
| `email` | `String` | **Yes** | **Yes** | — | User email address (lowercase, trimmed, regex validated) |
| `password` | `String` | Conditional | No | — | Bcrypt hashed password (`select: false` by default, required for `local` auth) |
| `googleId` | `String` | No | No | `null` | Google OAuth sub identifier |
| `avatar` | `String` | No | No | `""` | Profile avatar image URL |
| `authProvider` | `String` | **Yes** | No | `"local"` | Authentication mechanism (`"local" \| "google"`) |
| `createdAt` | `Date` | Auto | No | Auto | User account creation timestamp |
| `updatedAt` | `Date` | Auto | No | Auto | User profile update timestamp |

### Indexes & Hooks
- **Unique Index**: `{ email: 1 }`
- **Pre-save Hook**: Automatically hashes `password` using Bcrypt (`hashPassword`) if modified.
- **Methods**: `matchPassword(candidatePassword)` compares candidate password hash against database record.
- **Transform**: Removes `password` and `__v` from JSON serialization outputs.

---

## 2. 📄 Document Schema (`documents` collection)

Defined in [`server/src/models/Document.js`](file:///home/yirgazd/Documents/insa/projects/syncwrite_collab/server/src/models/Document.js).

### Field Definitions

| Field Name | Type | Required | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Unique document identifier |
| `title` | `String` | **Yes** | `"Untitled Document"` | Document title (trimmed) |
| `content` | `Mixed` | No | `""` | Document rich text content (HTML string or TipTap delta object) |
| `owner` | `ObjectId` (`ref: User`) | **Yes** | — | User ID of the document owner (indexed) |
| `collaborators` | `Array<Collaborator>` | No | `[]` | List of invited users and their access permission roles |
| `isPublic` | `Boolean` | No | `false` | Whether public link access is enabled |
| `publicRole` | `String` | No | `"viewer"` | Access role assigned to public link users (`"viewer" \| "commenter" \| "editor"`) |
| `lastModifiedBy` | `ObjectId` (`ref: User`) | No | — | User ID of the collaborator who last saved changes |
| `createdAt` | `Date` | Auto | Auto | Document creation timestamp |
| `updatedAt` | `Date` | Auto | Auto | Last modified timestamp |

### Sub-schema: `Collaborator`
```json
{
  "user": "ObjectId (ref: User, required)",
  "role": "String (enum: ['viewer', 'commenter', 'editor'], default: 'viewer')"
}
```

### Indexes & Instance Methods
- **Indexes**:
  - `{ owner: 1 }`
  - `{ title: "text" }` (Full-text index on title)
- **Method `getUserAccessLevel(userId)`**: Evaluates user permission level returning `'owner'`, `'editor'`, `'commenter'`, `'viewer'`, or `null`.

---

## 3. 📜 Revision Schema (`revisions` collection)

Defined in [`server/src/models/Revision.js`](file:///home/yirgazd/Documents/insa/projects/syncwrite_collab/server/src/models/Revision.js).

### Field Definitions

| Field Name | Type | Required | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Unique revision identifier |
| `documentId` | `ObjectId` (`ref: Document`) | **Yes** | — | Associated document ID (indexed) |
| `content` | `Mixed` | **Yes** | — | Document content snapshot at time of revision |
| `title` | `String` | No | `"Untitled Document"` | Document title snapshot at time of revision |
| `createdBy` | `ObjectId` (`ref: User`) | **Yes** | — | User who triggered or created the snapshot |
| `versionName` | `String` | No | `"Auto-saved Revision"` | Human readable label (e.g. `"Initial Version"`, `"Session Closing Snapshot"`) |
| `createdAt` | `Date` | Auto | Auto | Snapshot timestamp |

### Indexes
- **Compound Index**: `{ documentId: 1, createdAt: -1 }` (Optimized for retrieving version history chronologically).

---

## 4. 💬 Comment Schema (`comments` collection)

Defined in [`server/src/models/Comment.js`](file:///home/yirgazd/Documents/insa/projects/syncwrite_collab/server/src/models/Comment.js).

### Field Definitions

| Field Name | Type | Required | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Auto | Auto | Unique comment thread identifier |
| `documentId` | `ObjectId` (`ref: Document`) | **Yes** | — | Associated document ID (indexed) |
| `author` | `ObjectId` (`ref: User`) | **Yes** | — | User who started the comment thread |
| `content` | `String` | **Yes** | — | Text content of the comment (trimmed) |
| `isResolved` | `Boolean` | No | `false` | Whether the comment thread is marked as resolved |
| `resolvedBy` | `ObjectId` (`ref: User`) | No | `null` | User who resolved or reopened the thread |
| `resolvedAt` | `Date` | No | `null` | Timestamp when resolved |
| `replies` | `Array<Reply>` | No | `[]` | Nested discussion replies array |
| `createdAt` | `Date` | Auto | Auto | Comment thread creation timestamp |

### Sub-schema: `Reply`
```json
{
  "_id": "ObjectId (Auto)",
  "author": "ObjectId (ref: User, required)",
  "content": "String (required, trimmed)",
  "createdAt": "Date (default: Date.now)"
}
```

### Indexes
- **Compound Index**: `{ documentId: 1, createdAt: 1 }` (Optimized for fetching document comment threads in chronological order).
