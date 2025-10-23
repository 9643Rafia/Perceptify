# Perceptify — Server Setup

This README focuses on the backend/server setup for local development. It lists the expected `.env` variables, explains how the server loads environment variables, and shows the available scripts for running the server with `node` or `nodemon` (auto-restart).

If you need the full project-level developer guide (frontend + backend), that is available in the project root README; this file is intentionally server-focused.

## Prerequisites

- Node.js (v16+ recommended)
- npm
- (optional) MongoDB (Atlas or local). The project reads `MONGO_URI` from `.env`. If you don't have Mongo available you can run a local Mongo or later enable an in-memory server for development.

## Where to put your .env

Place a single `.env` file at the project root (same level as `package.json` and the `server/` folder). The server code reads environment variables via `dotenv` when the server starts.

Important: do NOT commit your `.env`.

## Expected .env variables (server)

Below are the keys the backend expects. Provide values appropriate for your environment. Example values are placeholder-only.

```
REACT_APP_API_URL=http://localhost:5000/api   # used by frontend
BROWSER=none

# Email (optional - for notifications/guardian approvals)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_SECURE=false

<!-- MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/perceptify?retryWrites=true&w=majority -->
MONGO_URI=mongodb://127.0.0.1:27017/perceptify (This is for development)
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Notes:
- `MONGO_URI` is required for database functionality. If you run a local MongoDB, use something like `mongodb://127.0.0.1:27017/perceptify`.
- `JWT_SECRET` is used to sign tokens. Keep it secret.

//Write How to start the project


## From project base directory

**Frontend:**

cd ./frontend && npm run start

**Backend:**

cd ./backend && npm run dev (for development)

cd ./backend && npm run start (for production)
