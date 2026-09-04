# GunungClimber - Hiking Itinerary Planner

A full-stack web application for planning hiking itineraries for Malaysian mountains with public transport integration.

## Features

### Admin Console
- User management (create, view, delete users)
- Admin authentication with secure login
- User profile management

### User Dashboard
- View all created hiking itineraries
- Create new hiking plans
- Edit existing itineraries
- Delete itineraries
- Calendar-based date selection
- Public transport route planning

### Hiking Itinerary Planning
- Select from popular Malaysian mountains
- Set difficulty levels (Easy, Moderate, Hard)
- Plan multi-day hikes
- Choose public transport methods (Bus, Train, Taxi, etc.)
- Set meeting points and locations
- Add detailed descriptions and notes

## Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite** for data persistence
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend
- **React** 18 with React Router
- **Axios** for API calls
- **React Calendar** for date selection
- **CSS3** for styling

## Project Structure

```
GunungClimber/
├── server/                 # Backend Express server
│   ├── routes/            # API endpoints
│   │   ├── auth.js       # Authentication routes
│   │   ├── admin.js      # Admin management
│   │   ├── user.js       # User profile
│   │   └── itinerary.js  # Itinerary CRUD
│   ├── middleware/        # Custom middleware
│   │   └── auth.js       # JWT verification
│   ├── db.js             # Database connection
│   ├── setup-db.js       # Database initialization
│   └── index.js          # Express app entry point
├── client/               # React frontend
│   ├── public/          # Static files
│   ├── src/
│   │   ├── pages/       # Page components
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── AdminConsole.js
│   │   │   ├── UserDashboard.js
│   │   │   └── ItineraryPlanner.js
│   │   ├── styles/      # CSS files
│   │   ├── App.js       # Main app component
│   │   └── index.js     # React entry point
│   └── package.json
├── db/                  # SQLite database storage
├── .env.example         # Environment variables template
├── .gitignore
├── package.json         # Backend dependencies
└── README.md
```

## Database Schema

### Users Table
- id (Primary Key)
- username (Unique)
- email (Unique)
- password (Hashed)
- full_name
- role (admin/user)
- created_at, updated_at

### Itineraries Table
- id (Primary Key)
- user_id (Foreign Key)
- title
- mountain_name
- start_date, end_date
- difficulty (easy/moderate/hard)
- description
- public_transport_method
- meeting_point
- created_at, updated_at

### Itinerary Details Table
- id (Primary Key)
- itinerary_id (Foreign Key)
- day_number
- description
- location
- activities
- accommodation
- created_at

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- npm or yarn
- SQLite3

### Installation

1. **Clone the repository**
```bash
cd ~/Desktop/GunungClimber
```

2. **Install dependencies**
```bash
npm run setup
```

This command will:
- Install backend dependencies
- Install frontend dependencies
- Initialize the SQLite database
- Create a default admin user

3. **Configure environment variables**
```bash
cp .env.example .env
```

Update `.env` with your settings:
```
PORT=5000
NODE_ENV=development
DB_PATH=./db/gunungclimber.db
JWT_SECRET=your-super-secret-key
JWT_EXPIRY=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Running the Application

#### Terminal 1 - Backend Server
```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will start on `http://localhost:5000`

#### Terminal 2 - Frontend Development Server
```bash
npm run client
```

The frontend will start on `http://localhost:3000`

### Default Admin Credentials
- **Username:** admin
- **Password:** admin123

⚠️ **Important:** Change these credentials in production!

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Admin
- `POST /api/admin/create-user` - Create new user (Admin only)
- `GET /api/admin/users` - List all users (Admin only)
- `DELETE /api/admin/users/:id` - Delete user (Admin only)

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Itinerary
- `POST /api/itinerary` - Create itinerary
- `GET /api/itinerary` - List user's itineraries
- `GET /api/itinerary/:id` - Get itinerary details
- `PUT /api/itinerary/:id` - Update itinerary
- `DELETE /api/itinerary/:id` - Delete itinerary
- `POST /api/itinerary/:id/details` - Add itinerary day details
- `GET /api/itinerary/:id/details` - Get day-by-day details

## Malaysian Mountains Included

- Gunung Kinabalu
- Gunung Tahan
- Gunung Ledang
- Gunung Semporna
- Gunung Irau
- Gunung Jerai
- Gunung Rajah

## Public Transport Options

- Bus
- Train
- Taxi/Grab
- Combined (Bus + Train)
- Self Drive

## Future Enhancements

- [ ] Real-time public transport API integration
- [ ] Weather forecasting for hiking dates
- [ ] Trail difficulty ratings and reviews
- [ ] Group hiking planning
- [ ] Accommodation booking integration
- [ ] GPS tracking during hikes
- [ ] Photo sharing and trip logs
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] Map integration with routes

## Security Notes

- Passwords are hashed using bcryptjs
- Authentication uses JWT tokens
- Environment variables are used for secrets
- CORS is enabled for development (configure for production)
- SQLite is suitable for development (consider PostgreSQL for production)

## Troubleshooting

### Port already in use
If port 5000 is already in use, update PORT in `.env` or stop the conflicting process.

### Database errors
Delete `db/gunungclimber.db` and run `npm run setup` to reinitialize.

### CORS errors
Check that both frontend and backend are running and API base URL is correct in `client/src/pages/*.js`

## Development Notes

- Backend API base URL: `http://localhost:5000/api`
- Frontend runs on: `http://localhost:3000`
- JWT tokens are stored in browser localStorage
- Token expires in 7 days by default

## License

MIT

## Contact & Support

For issues, suggestions, or contributions, please contact the development team.
