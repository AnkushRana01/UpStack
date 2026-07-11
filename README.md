# Cloud-Based File Sharing and Backup System

A production-shaped full-stack file sharing and backup platform built with React, Tailwind CSS, Node.js, Express, and MongoDB.

## Project Structure

```text
dropbox/
  upstack-backend/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    utils/
    server.js
  upstack-frontend/
    src/
      components/
      context/
      lib/
      pages/
    index.html
  README.md
```

## Features

- JWT authentication with bcrypt password hashing
- Admin and user role-based access control
- Secure upload, download, delete, folder organization, search, filter, and sort
- Drag-and-drop upload UI with progress
- MongoDB collections for users, files, shared files, and activity logs
- AWS S3 storage support for uploaded files
- Local encrypted file storage fallback for development
- Secure share links and user-to-user sharing
- Admin dashboard with users, files, storage, and activity monitoring
- Dark/light theme, responsive dashboard, protected routes, loading and error states

## Installation

1. Install dependencies:

```bash
cd upstack-backend
npm install
cd ../upstack-frontend
npm install
```

2. Create environment files:

**Windows:**
```bash
cd upstack-backend
copy .env.example .env
cd ../upstack-frontend
copy .env.example .env
```

**macOS/Linux:**
```bash
cd upstack-backend
cp .env.example .env
cd ../upstack-frontend
cp .env.example .env
```

3. Start MongoDB locally or set `MONGO_URI` to a hosted MongoDB connection string.

4. Run the apps in separate terminals:

```bash
cd upstack-backend
npm run dev
```

```bash
cd upstack-frontend
npm run dev
```

Frontend: `http://localhost:5173` (or the next available Vite port)
Backend API: `http://localhost:5000/api`

## Environment Variables

Backend variables live in `upstack-backend/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/upstack
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=replace-with-64-hex-characters
STORAGE_DRIVER=local
LOCAL_STORAGE_DIR=storage/uploads
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
```

Frontend variables live in `upstack-frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Generate an encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API Routes

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Files:

- `GET /api/files?search=&type=&sort=createdAt&order=desc&folder=`
- `POST /api/files/upload`
- `POST /api/files/folders`
- `GET /api/files/:id/download`
- `DELETE /api/files/:id`

S3 Upload:

- `POST /api/s3/upload`

Sharing:

- `POST /api/share/:fileId/user`
- `POST /api/share/:fileId/link`
- `GET /api/share/link/:token`
- `GET /api/share/link/:token/download`
- `GET /api/share/me`

Admin:

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id`
- `GET /api/admin/activity`

## Database Schema

Users:

- `name`, `email`, `password`, `role`, `isActive`, `storageUsed`, timestamps

Files:

- `owner`, `folder`, `originalName`, `storedName`, `mimeType`, `size`, `storageDriver`, `storageKey`, `backupKey`, `iv`, `authTag`, `checksum`, `isFolder`, timestamps

SharedFiles:

- `file`, `owner`, `sharedWith`, `permission`, `token`, `expiresAt`, `isLink`, timestamps

ActivityLogs:

- `actor`, `action`, `targetType`, `targetId`, `metadata`, `ipAddress`, timestamps

## Deployment

Backend:

1. Set production env variables on Render, Railway, Fly.io, AWS, or your preferred host.
2. Use MongoDB Atlas for `MONGO_URI`.
3. Set `STORAGE_DRIVER=s3` and configure AWS credentials and bucket.
4. Enable HTTPS at the load balancer or hosting platform.
5. Run `npm start` from `upstack-backend`.

Frontend:

1. Set `VITE_API_URL` to the deployed backend `/api` URL.
2. Run `npm run build` from `upstack-frontend`.
3. Deploy the generated `dist` folder to Vercel, Netlify, Cloudflare Pages, or static hosting.

Security checklist:

- Use strong `JWT_SECRET` and `ENCRYPTION_KEY`.
- Restrict CORS `CLIENT_URL`.
- Keep the S3 bucket private.
- Serve only signed or proxied downloads in production.
- Add malware scanning for high-risk uploads.
- Put the backend behind HTTPS.
