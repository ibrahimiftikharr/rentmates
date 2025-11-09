# RentMates - Unified Frontend

A unified React/Vite application combining Student Dashboard, Landlord Dashboard, and Authentication screens.

## Structure

```
frontend/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Main routing component
│   ├── domains/
│   │   ├── auth/             # Authentication domain
│   │   │   ├── pages/        # Auth pages
│   │   │   ├── components/   # Auth-specific components
│   │   │   ├── services/     # Auth services
│   │   │   └── styles/       # Auth styles (local)
│   │   ├── student/          # Student domain
│   │   │   ├── pages/        # Student pages
│   │   │   ├── components/   # Student-specific components
│   │   │   ├── services/     # Student services
│   │   │   └── styles/       # Student styles (local)
│   │   ├── landlord/         # Landlord domain
│   │   │   ├── pages/        # Landlord pages
│   │   │   ├── components/   # Landlord-specific components
│   │   │   ├── services/     # Landlord services
│   │   │   └── styles/       # Landlord styles (local)
│   │   └── shared/           # Shared resources
│   │       ├── ui/           # Reusable UI components
│   │       ├── services/     # Common services
│   │       ├── utils/        # Helper functions
│   │       └── types/        # TypeScript types
├── public/
└── package.json
```

## Installation

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

The app will start on `http://localhost:5173`

## Routes

- `/auth` - Login/Signup page
- `/student/*` - Student dashboard (protected)
- `/landlord/*` - Landlord dashboard (protected)

## Features

- Single package.json for all dependencies
- Domain-based architecture for scalability
- Shared UI components to avoid duplication
- Role-based routing and authentication
- Local styles per domain (not consolidated)

