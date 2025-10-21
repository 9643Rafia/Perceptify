# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Perceptify is a full-stack deepfake detection educational platform built with React (frontend) and Express/Node.js (backend). The application provides educational content about deepfakes and includes authentication with special guardian approval workflows for minors.

## Development Commands

### Frontend (React)
Run these commands from the `perceptify/` directory:

```bash
# Start development server (runs on http://localhost:3000)
npm start

# Run tests in watch mode
npm test

# Build for production
npm run build
```

### Backend (Express Server)
The backend server is located in `perceptify/server/`. To run the server:

```bash
# From perceptify/server/ directory
node server.js
```

The server runs on port 5000 by default (configurable via PORT environment variable).

### Environment Setup

The backend requires a `.env` file in `perceptify/server/` with:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT token generation
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)
- Email configuration: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `EMAIL_SECURE`

The frontend can use `REACT_APP_API_URL` in `.env` to configure the API endpoint (defaults to http://localhost:5000/api).

## Architecture

### Frontend Structure

**Main Application Flow:**
- Entry point: `src/index.js` - Sets up React Router and AuthProvider context
- Layout: `src/App.js` - Contains Header, Footer, and Outlet for nested routes
- Routing: Uses React Router v7 with createBrowserRouter

**Key Directories:**
- `src/screens/` - Page components (HomeScreen, LoginForm, SignupForm, Dashboard, Features, ForEducators, GuardianApproval, DeepfakeDemo, Contact)
- `src/components/` - Reusable components (Header, Footer, ProtectedRoute)
- `src/context/` - React Context providers (AuthContext for authentication state)
- `src/services/` - API communication layer
  - `api.js` - Axios instance with authentication interceptor
  - `auth.service.js` - Authentication operations (login, logout, getCurrentUser)
  - `storage.service.js` - Token storage utilities
- `src/assets/styles/` - Custom CSS (bootstrap.custom.css, index.css)

**Authentication Flow:**
- AuthContext wraps the entire app and manages user state
- API service automatically attaches JWT tokens to requests via interceptor
- Protected routes should use the ProtectedRoute component
- Auth state accessible via `useAuth()` hook

### Backend Structure

**Server Architecture:**
The backend follows an MVC-like pattern with clear separation of concerns:

- `server/server.js` - Express app initialization, middleware setup, and server startup
- `server/config/` - Configuration modules
  - `config.js` - Centralized environment variable management
  - `db.js` - MongoDB connection logic
- `server/models/` - Mongoose schemas
  - `user.model.js` - User schema with password hashing, role-based fields (Learner/Guardian/Educator), and guardian approval workflow
- `server/controllers/` - Business logic
  - `auth.controller.js` - Registration, login, getCurrentUser, account approval
- `server/routes/` - API route definitions
  - `auth.routes.js` - Authentication endpoints mounted at `/api/auth`
- `server/middleware/` - Custom middleware
  - `auth.middleware.js` - JWT verification
- `server/utils/` - Utility functions
  - `jwt.utils.js` - Token generation and verification
  - `email.utils.js` - Email sending functionality

**Key Features:**
- JWT-based authentication with bearer token
- Role-based user system (Learner, Guardian, Educator)
- Guardian approval workflow for minors (age < 18)
  - Minors get status "pending" on registration
  - Email sent to guardian with approval link containing JWT token
  - Account activated only after guardian approval
- Password hashing with bcrypt (pre-save hook)
- CORS enabled for frontend communication

**API Endpoints:**
All auth routes are prefixed with `/api/auth`:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/approve` - Guardian account approval

**Database:**
- Uses MongoDB with Mongoose ODM
- User model includes: fullName, email, password, age, role, guardianEmail, status, timestamps
- User schema enforces validation for email format, password length, age range, and required fields

## Testing

The project uses React Testing Library and Jest:
- Test files use `.test.js` extension
- Configuration: `src/setupTests.js` imports jest-dom matchers
- Sample test: `src/App.test.js`

## Styling

- Bootstrap 5.3.6 via react-bootstrap
- Custom Bootstrap theme: `src/assets/styles/bootstrap.custom.css`
- Custom global styles: `src/assets/styles/index.css`
- Additional libraries: framer-motion for animations, AOS for scroll animations

## Important Patterns

**Authentication State Management:**
The application uses React Context (AuthContext) rather than Redux for state management. Always use the `useAuth()` hook to access authentication state and methods.

**Minor Registration Flow:**
When a user under 18 registers, the system:
1. Creates user with status "pending"
2. Generates approval token
3. Sends email to guardianEmail with approval link
4. User cannot login until guardian clicks approval link
5. Approval endpoint verifies token and updates status to "active"

**API Communication:**
All API calls should go through the axios instance in `src/services/api.js` which automatically handles token attachment. Direct axios imports should be avoided for authenticated requests.
