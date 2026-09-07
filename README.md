# UpStack – Secure, Cloud-Based File Sharing and Backup System

UpStack is a secure, cloud-based file storage and sharing platform built for individuals and teams. Authenticated users can upload, organize, store, and share files with other users through a fast, responsive interface backed by AWS S3 cloud storage, MongoDB, and Express.js.

---

## Overview

Modern teams require a reliable workspace to store assets, organize project directories, and collaborate without complex file management overhead. UpStack addresses this by providing an intuitive file management system with:

- **Centralized File Management**: Upload files via drag-and-drop or file pickers, organize content into nested directories, and filter, sort, or search across your entire workspace.
- **Collaborative Sharing**: Share files directly with registered users by email address, granting dedicated **Download permission** so collaborators can retrieve files securely.
- **Robust Authentication & Authorization**: Protect sensitive data with JSON Web Token (JWT) sessions, salted bcrypt password hashing, and role-based permissions separating standard users from administrators.
- **Cloud Storage Infrastructure**: Scalable object storage powered by AWS S3 with server-side encryption (`AES256`), with modular backend architecture supporting local storage drivers during development.
- **Administrative Control**: Dedicated administrative tooling to oversee user accounts, manage roles, suspend abusive access, and safeguard against accidental administrator lockouts through safe role-transfer workflows.

---

## Features

### Authentication & Sessions
- **User Registration & Login**: Secure signup and authentication with client-side form validation and server-side credential verification.
- **JWT-Based Authentication**: Stateless authentication utilizing JSON Web Tokens stored securely on the client and validated via backend middleware.
- **Password Protection**: Passwords hashed using salted `bcryptjs` before persisting to MongoDB.
- **Protected Routes**: Client-side router guards and server-side authorization middleware protecting private endpoints from unauthenticated access.

### File & Folder Management
- **File Upload**: Direct file uploads with drag-and-drop support, real-time progress indicators, and automated quota recalculation.
- **Direct File Downloads**: One-click download serving original files with proper MIME types and Content-Disposition headers.
- **File & Folder Deletion**: Safe deletion mechanisms with confirmation dialogs and active loading states to prevent accidental duplicate actions.
- **Folder Organization**: Create nested folder hierarchies and navigate smoothly with directory path breadcrumbs.
- **Search, Filter & Sort**: Instantly search file names, filter by document or media types, and sort by date, size, or alphabetical order.

### File Sharing
- **User-to-User Sharing**: Share any owned file with another registered user via email address.
- **Shareable Links**: Generate secure public share links with optional expiry dates.
- **Download-Only Access**: Simplified sharing model granting explicit **Download permission** without confusing or unsupported view-only states.
- **Shared Files Section**: Dedicated dashboard listing all incoming and outgoing file shares, complete with owner/recipient details and direct download actions.

### Cloud Storage
- **AWS S3 Integration**: High-availability cloud storage utilizing the AWS SDK (`@aws-sdk/client-s3`) with automated server-side encryption (`AES256`).
- **Storage Quotas**: Per-user quota of **200 MB** and an organisation-wide cap of **5 GB** enforced on every upload path in the backend.

### Dashboard & Analytics
- **Workspace Metrics**: Four overview cards — Total Files, Used Storage, Created Folders, and a Quick Upload drop zone.
- **Storage Consumption Bar**: Visual gauge tracking used storage against the user quota, including breakdown by file type (Images, Documents, Media).
- **Recent Activity Feed**: Chronological log of recent operations (uploads, folder creation) with timestamps.

### Administration & User Management
- **System Metrics**: Overview of total registered users, active cloud files, and cumulative storage consumed across the platform.
- **User Account Roster**: Tabular view of all accounts showing name, email, role, and current status (Active vs. Suspended).
- **Role Management**: Toggle user accounts between `user` and `admin` roles.
- **Account Suspension**: Temporarily suspend or reactivate user accounts with immediate enforcement on session validity.
- **Admin Role Transfer Guarantee**: Built-in safeguard preventing system lockouts. If an administrator attempts to suspend or demote their own account, the system requires and enforces transferring administrator privileges to an active user first.
- **Embedded Workspace Settings**: Built-in account settings panel inside the Admin Console for quick profile inspection.

### UI & User Experience
- **Responsive Layout**: Fluid design built with Tailwind CSS that adapts across desktop, tablet, and mobile screens.
- **Dark / Light Mode**: Persistent theme switcher with custom dark mode palettes.
- **Non-blocking Visual Loaders**: Context-aware spinners on buttons and clean page loaders during data retrieval without disruptive full-screen blocking.

---

## Storage Limits

UpStack enforces storage quotas at the backend — limits are checked **before** any file is written to S3, ensuring they cannot be bypassed via the API.

| Scope | Limit |
|---|---|
| **Per-user quota** | **200 MB** |
| **Organisation total** | **5 GB** |

- Every upload (both S3 direct and encrypted paths) calls `checkStorageLimits()` before proceeding.
- Multer's `fileSize` limit is set to `200 MB` to reject oversized payloads at the network layer as an early guard.
- A clear error message is returned when either limit would be exceeded.

---

## File Sharing Permissions

UpStack implements a simplified, unambiguous file-sharing model:

| Role | Permissions |
|---|---|
| **File Owner** | Full control over their files: upload, organize into folders, share with other users, download, and delete. |
| **Shared Recipient** (`download` permission) | Can access the shared file from their **Shared Files** section and download the original file buffer directly to their device. |

> **Note**: UpStack intentionally eliminates "View-only" share permissions and embedded file previewers in favour of direct, reliable, full-fidelity file downloads.

---

## Admin Role & User Management

To maintain system integrity, administrative controls are strictly regulated:

- **Restricted Access**: Non-admin users cannot access administrative endpoints or UI routes; attempts are blocked by backend middleware (`authorize('admin')`) and router guards.
- **User Role Elevation & Demotion**: Administrators can promote standard users to `admin` or demote other admins to standard `user`.
- **Account Suspension**: Administrators can suspend active accounts. Suspended accounts are immediately blocked from logging in or making authenticated requests.
- **Guaranteed Active Admin**: The system guarantees that at least one active administrator always exists:
  - **Self-Suspension / Demotion**: An administrator cannot suspend or demote themselves if they are the only active admin.
  - **Single Eligible User**: If exactly one other active user exists, admin rights are automatically transferred upon confirmation before the suspension takes effect.
  - **Multiple Eligible Users**: If multiple active users exist, a modal prompts the administrator to select the specific active user who will receive administrator status.
  - **Sole Account**: If the administrator is the only user in the database, self-suspension and demotion are prohibited entirely.

---

## Authentication & Navigation Flow

UpStack uses stateless JWT authentication with well-defined user journey states:

```text
Unauthenticated Visitor
            |
            v
     +--------------+
     |  Login Page  | --- Public authentication (/login, /register)
     +------+-------+
            |
      (Authenticate)
            v
     +--------------+
     |  Dashboard   | --- Authenticated workspace (/)
     +------+-------+
            |
      (User Log Out)
            v
     +--------------+
     |  Login Page  | --- Directed to /login upon logout
     +--------------+
```

1. **Unauthenticated Sessions**: Navigating to the root or any protected route redirects the visitor to the **Login Page** (`/login`).
2. **Onboarding**: Users can easily toggle between **Sign In** (`/login`) and **Sign Up** (`/register`).
3. **Session Verification**: Upon successful authentication, the backend issues a signed JWT, stored in `localStorage`, and the user is redirected to the **Dashboard** (`/`).
4. **Logout Flow**: Logging out clears the local authentication state and immediately redirects the user to the **Login Page** (`/login`).

---

## Application Sections

### Dashboard (`/`)
- Four summary cards: **Total Files**, **Used Storage**, **Created Folders**, and a **Quick Upload** drag-and-drop card.
- Visual **Storage Usage** progress bar calibrated against the user quota, broken down by Images, Documents, and Media.
- **Recent Activity** list tracking user actions with timestamps and file names.

### My Files (`/files`)
- Complete workspace file listing with search, MIME-type filter, and sorting controls.
- Folder creation and folder deletion controls.
- Subfolder breadcrumb navigation.
- Share modal enabling quick user-to-user sharing with Download access.
- Confirmation dialogs for file and folder deletion.

### Shared Files (`/shared`)
- **Shared With Me** tab: card view of all files shared with the authenticated user, with owner name, share timestamp, file size, and a direct **Download** button.
- **Shared By Me** tab: card view of all files the user has shared out, with recipient details and a **Revoke** action.

### Admin Console (`/admin`)
- Accessible only to users with the `admin` role.
- System metrics: Registered Users, Cloud Files, and Total Storage against the 5 GB organisation limit.
- Full user management table with real-time status badges (`Active` / `Suspended`).
- Action buttons for role modification and account suspension.
- Built-in admin role transfer modal for safe administrator transitions.
- Embedded Workspace Settings panel.

### Workspace Settings (`/settings`)
- Side-by-side layout with two panels:
  - **Workspace Settings**: Account Holder Name, Registered Email, Access Role, and Private Quota Used.
  - **Total Used Storage**: Live storage usage bar with dynamic recalculation from the `/files` API.

---

## Loading Indicators & UI Feedback

Asynchronous operations provide clear visual feedback to prevent duplicate submissions and communicate status:

- **Page Loaders**: Centered animated spinners when loading initial data for the Dashboard, My Files, Shared Files, and Admin views.
- **Action Spinners**:
  - **Authentication**: Signing in / Creating account with disabled button states.
  - **File Upload**: Progress feedback during active uploads.
  - **Folder Operations**: Spinner and text updates on New Folder / Delete Folder.
  - **File Sharing**: "Sharing..." indicator with disabled inputs during share creation.
  - **Downloads**: Spinner inside the download button during file retrieval.
  - **Admin Actions**: Row-level inline spinners during user status or role updates.
- **Non-blocking Operations**: Background search queries, file filtering, and manual refreshes update seamlessly without blocking full-screen overlays.

---

## Technology Stack

### Frontend
- **Framework**: [React 18](https://react.dev/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Routing**: [React Router 6](https://reactrouter.com/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express 4](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose 8](https://mongoosejs.com/)
- **Authentication**: [JSON Web Tokens (jsonwebtoken)](https://github.com/auth0/node-jsonwebtoken)
- **Password Hashing**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Multipart Form Data**: [Multer 2](https://github.com/expressjs/multer)
- **Cloud Storage**: [AWS SDK for JavaScript v3 (`@aws-sdk/client-s3`)](https://aws.amazon.com/sdk-for-javascript/)
- **Security & Utilities**: [Helmet](https://helmetjs.github.io/), [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit), [CORS](https://github.com/expressjs/cors), [Morgan](https://github.com/expressjs/morgan), [dotenv](https://github.com/motdotla/dotenv)

---

## Project Structure

```text
UpStack/
+-- upstack-backend/
|   +-- config/
|   |   +-- db.js                    # MongoDB connection logic
|   +-- controllers/
|   |   +-- adminController.js       # System stats, user roster, role transfer
|   |   +-- authController.js        # Register, login, me, activity log
|   |   +-- fileController.js        # File CRUD, folder creation, authorized download
|   |   +-- s3UploadController.js    # Direct multipart S3 file upload handler
|   |   +-- shareController.js       # User-to-user sharing & shared downloads
|   +-- middleware/
|   |   +-- authMiddleware.js        # JWT verification & role authorization
|   |   +-- errorMiddleware.js       # 404 handler and central error responder
|   |   +-- uploadMiddleware.js      # Multer in-memory upload configuration
|   +-- models/
|   |   +-- ActivityLog.js           # Audit and activity log schema
|   |   +-- File.js                  # File and folder schema with storage metadata
|   |   +-- SharedFile.js            # User share record schema (download permission)
|   |   +-- User.js                  # User account schema with storage counters
|   +-- routes/
|   |   +-- adminRoutes.js           # /api/admin endpoints
|   |   +-- authRoutes.js            # /api/auth endpoints
|   |   +-- fileRoutes.js            # /api/files endpoints
|   |   +-- s3UploadRoutes.js        # /api/s3 endpoints
|   |   +-- shareRoutes.js           # /api/share endpoints
|   +-- scripts/
|   |   +-- check_mongo.js           # Dev helper: verify MongoDB connection
|   |   +-- check_mongo_fallback.js  # Dev helper: SRV fallback connection check
|   +-- services/
|   |   +-- activityService.js       # Activity log helper
|   |   +-- encryptionService.js     # AES-256-GCM buffer encrypt/decrypt
|   |   +-- s3.js                    # AWS SDK S3 client & bucket operations
|   |   +-- storageLimitService.js   # Per-user (200 MB) & org (5 GB) quota checks
|   |   +-- storageService.js        # Modular storage driver interface
|   +-- utils/
|   |   +-- s3.js                    # S3 upload helper used by s3UploadController
|   +-- package.json
|   +-- server.js                    # Express application entry point
|
+-- upstack-frontend/
|   +-- src/
|   |   +-- components/
|   |   |   +-- AppFooter.jsx        # Global application footer
|   |   |   +-- FileTable.jsx        # File list, actions, delete dialog
|   |   |   +-- GlobalSearchBar.jsx  # Debounced global search with instant results
|   |   |   +-- Layout.jsx           # Sidebar navigation, top header, dark toggle
|   |   |   +-- MetricCard.jsx       # Metric statistic card component
|   |   |   +-- PageLoader.jsx       # Centered page-level loading spinner
|   |   |   +-- ProtectedRoute.jsx   # Auth route guard (redirects unauthenticated)
|   |   |   +-- QuickUploadCard.jsx  # Dashboard drag-and-drop quick upload card
|   |   |   +-- ShareModal.jsx       # File sharing modal (user-to-user & link)
|   |   |   +-- UploadNewButton.jsx  # Header upload dropdown (files, folder, create)
|   |   +-- context/
|   |   |   +-- AuthContext.jsx      # Authentication state and login/logout handlers
|   |   +-- lib/
|   |   |   +-- api.js               # Axios client with JWT interceptor & formatters
|   |   +-- pages/
|   |   |   +-- Admin.jsx            # Admin console, user management, role transfer
|   |   |   +-- Auth.jsx             # Login and registration forms
|   |   |   +-- Dashboard.jsx        # Metrics, quick upload, activity feed, storage
|   |   |   +-- Files.jsx            # File vault, folder navigation, search/filter
|   |   |   +-- Settings.jsx         # Workspace info and live storage usage
|   |   |   +-- ShareLink.jsx        # Public share link landing page
|   |   |   +-- Shared.jsx           # Shared Files - incoming and outgoing shares
|   |   +-- App.jsx                  # Route definitions and layout nesting
|   |   +-- styles.css               # Tailwind CSS directives and custom utilities
|   |   +-- main.jsx                 # React DOM render root with Toaster
|   +-- index.html
|   +-- package.json
|   +-- vercel.json
|   +-- vite.config.js
|
+-- README.md
```

---

## API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user account |
| `POST` | `/api/auth/login` | Public | Authenticate credentials and receive JWT |
| `GET` | `/api/auth/me` | Private | Retrieve current user profile and storage quota |
| `GET` | `/api/auth/activity` | Private | Retrieve activity history for the current user |

### Files & Folders (`/api/files`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/files` | Private | List files/folders (supports `folder`, `search`, `type`, `sort`, `order`) |
| `POST` | `/api/files/upload` | Private | Upload a file via Multer to configured storage (encrypted) |
| `POST` | `/api/files/folders` | Private | Create a new folder under root or a parent folder |
| `GET` | `/api/files/:id/download` | Private | Download file (authorized for owner or download recipient) |
| `DELETE` | `/api/files/:id` | Private | Delete a file or folder and clean up storage assets |

### S3 Direct Upload (`/api/s3`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/s3/upload` | Private | Upload file directly to AWS S3 bucket with server-side encryption |

### File Sharing (`/api/share`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/share/:fileId/user` | Private | Share file with a user by email with Download permission |
| `GET` | `/api/share/me` | Private | List all files shared with the authenticated user |
| `GET` | `/api/share/me/:shareId/download` | Private | Download a shared file as an authorized recipient |
| `GET` | `/api/share/by-me` | Private | List all files shared by the authenticated user |
| `DELETE` | `/api/share/:shareId` | Private | Revoke a share (user-to-user or link) |
| `POST` | `/api/share/:fileId/link` | Private | Generate a secure shareable link |
| `GET` | `/api/share/link/:token` | Public | Inspect a public share link |
| `GET` | `/api/share/link/:token/download` | Public | Download file via public share link |

### Admin Console (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Admin | Retrieve platform-wide metrics and system activity |
| `GET` | `/api/admin/users` | Admin | List all registered user accounts |
| `PATCH` | `/api/admin/users/:id` | Admin | Update user role, status (active/suspended), or transfer admin |
| `GET` | `/api/admin/activity` | Admin | Retrieve system-wide activity logs |

---

## Security

UpStack applies defense-in-depth principles across the entire application:

- **JWT Authentication**: Short-to-medium lifespan JSON Web Tokens passed via `Authorization: Bearer <token>` headers on all API requests.
- **Password Protection**: Passwords hashed with salted `bcryptjs` before database persistence; raw passwords are never logged or stored.
- **Role-Based Authorization**: Granular route guards (`protect` and `authorize('admin')`) verifying identities and permissions on every incoming request.
- **Strict Ownership & Permission Checks**: File operations (download, delete, share) verify that the requesting user is either the verified file owner or an explicitly authorized share recipient before any storage buffer is accessed.
- **Storage Quota Enforcement**: Per-user (200 MB) and organisation (5 GB) limits checked server-side on every upload path.
- **AWS S3 Server-Side Encryption**: Objects stored in AWS S3 enforce server-side `AES256` encryption (`ServerSideEncryption: 'AES256'`).
- **HTTP Hardening**: Helmet middleware sets essential HTTP security headers (XSS filtering, clickjacking protection, frameguard).
- **API Rate Limiting**: Centralized rate limiting prevents brute-force attempts on API endpoints.
- **Credential Hygiene**: Sensitive tokens, database connection URIs, and AWS access keys are loaded strictly via environment variables and never hard-coded.

---

## Installation & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (running locally or MongoDB Atlas connection string)
- AWS Account with S3 Bucket credentials

### Step 1: Clone the Repository
```bash
git clone https://github.com/AnkushRana01/UpStack.git
cd UpStack
```

### Step 2: Configure Environment Variables

**Backend Configuration:**
Create `upstack-backend/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=your_64_hex_character_encryption_key
STORAGE_DRIVER=s3
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET=your_s3_bucket_name
```

> Generate an encryption key in Node.js:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

**Frontend Configuration:**
Create `upstack-frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Install Dependencies

```bash
# Backend dependencies
cd upstack-backend
npm install

# Frontend dependencies
cd ../upstack-frontend
npm install
```

### Step 4: Run the Application

Start the backend API server (from `upstack-backend/`):
```bash
npm run dev
```

In a separate terminal, start the frontend development server (from `upstack-frontend/`):
```bash
npm run dev
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **API Health Check**: `http://localhost:5000/api/health`

### Production Build
To create an optimized production build of the frontend:
```bash
cd upstack-frontend
npm run build
```
The compiled output will be generated in `upstack-frontend/dist/`.

---

## Environment Variables Reference

### Backend (`upstack-backend/.env`)
| Variable | Description | Example |
|---|---|---|
| `PORT` | Port number for Express server | `5000` |
| `NODE_ENV` | Runtime environment mode | `development` / `production` |
| `CLIENT_URL` | Allowed CORS origin for the frontend client | `http://localhost:5173` |
| `MONGO_URI` | MongoDB connection string | *(your MongoDB URI)* |
| `JWT_SECRET` | Secret key for signing and verifying JWT tokens | *(secure random string)* |
| `JWT_EXPIRES_IN` | JWT token validity duration | `7d` |
| `ENCRYPTION_KEY` | 64-hex-character key used for encrypted storage | *(64 hex characters)* |
| `STORAGE_DRIVER` | Active storage driver | `s3` |
| `AWS_REGION` | AWS S3 bucket region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key ID | *(your AWS access key)* |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret access key | *(your AWS secret key)* |
| `AWS_S3_BUCKET` | AWS S3 target bucket name | *(your bucket name)* |

### Frontend (`upstack-frontend/.env`)
| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Base URL for backend API requests | `http://localhost:5000/api` |
