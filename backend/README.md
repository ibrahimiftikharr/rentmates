# RentMates - Backend Server

Express.js backend server with MongoDB for authentication.

## Installation

```bash
cd backend
npm install
```

## Configuration

Create a `.env` file (already created with default values):

```
MONGO_URI=mongodb+srv://ibrahimiftikhar0864_db_user:iUKh7mLZxiEUYjbQ@rentmates.a4rija4.mongodb.net/?appName=RentMates
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=5000
```

## Running

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)
- `GET /api/health` - Health check

## Authentication

JWT tokens are returned on login/signup and should be included in the `Authorization` header:
```
Authorization: Bearer <token>
```

