# GunungClimber Project - Claude Code Instructions

## Project Overview
Full-stack hiking itinerary planner for Malaysian mountains with admin console and public transport integration.

## Tech Stack
- **Backend**: Node.js + Express + SQLite
- **Frontend**: React 18 + React Router
- **Authentication**: JWT + bcryptjs
- **Database**: SQLite3

## Key Files
- `server/index.js` - Express server entry point
- `client/src/App.js` - React main component
- `server/setup-db.js` - Database initialization
- `.env.example` - Environment variables template

## Development Setup

### First Time Setup
```bash
npm run setup
```

### Run Both Servers
Terminal 1:
```bash
npm run dev
```

Terminal 2:
```bash
npm run client
```

Access:
- Frontend: http://localhost:3001
- Backend: http://localhost:5001
- Default Admin: username: `admin`, password: `admin123`

## API Endpoints

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register`

### Admin (requires admin role)
- `POST /api/admin/create-user`
- `GET /api/admin/users`
- `DELETE /api/admin/users/:id`

### User
- `GET /api/user/profile`
- `PUT /api/user/profile`

### Itinerary
- `POST /api/itinerary` - Create
- `GET /api/itinerary` - List user's
- `GET /api/itinerary/:id` - Get details
- `PUT /api/itinerary/:id` - Update
- `DELETE /api/itinerary/:id` - Delete
- `POST /api/itinerary/:id/details` - Add day details
- `GET /api/itinerary/:id/details` - Get day details

## Database
SQLite3 stored at `db/gunungclimber.db`

Tables:
- `users` - User accounts with roles
- `itineraries` - Hiking plans
- `itinerary_details` - Day-by-day breakdown

## Frontend Components
- `Login.js` - Authentication
- `Register.js` - User signup
- `AdminConsole.js` - User management
- `UserDashboard.js` - Itinerary list
- `ItineraryPlanner.js` - Create/edit hikes

## Features
- ✅ Admin user management
- ✅ User authentication (JWT)
- ✅ Hiking itinerary CRUD
- ✅ Mountain selection (7 Malaysian peaks)
- ✅ Public transport planning
- ✅ Calendar date picker
- ✅ Responsive design

## Environment Variables (.env)
```
PORT=5000
NODE_ENV=development
DB_PATH=./db/gunungclimber.db
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## Notes
- Database file is created automatically on first setup
- JWT tokens expire in 7 days
- Passwords are hashed with bcryptjs (10 rounds)
- CORS enabled for localhost:3000
- Development only - configure for production

## Common Issues
- Port already in use: Change PORT in .env
- CORS errors: Ensure both servers running
- Database errors: Delete db/ and re-run setup
