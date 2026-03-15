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

# Hosted scam-detection API (no local ml-service required)
ML_API_BASE_URL=https://justforextras-rentmates-scam-detector.hf.space
ML_API_TIMEOUT_MS=30000
```

Backend calls `${ML_API_BASE_URL}/predict` automatically.

## Running

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## Run Without Local ML Service

1. Start backend only: `npm run dev`
2. Start frontend normally.
3. Backend will call the deployed Hugging Face ML API for scam scoring.

You do not need to run `ml-service` locally for scam prediction.

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

