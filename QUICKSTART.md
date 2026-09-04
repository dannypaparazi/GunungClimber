# GunungClimber - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
cd ~/Desktop/GunungClimber
npm run setup
```

### 2. Start Backend Server
```bash
npm run dev
```
Backend runs on: **http://localhost:5000**

### 3. Start Frontend (in another terminal)
```bash
npm run client
```
Frontend runs on: **http://localhost:3001**

### 4. Login
Open http://localhost:3001 in your browser
- **Admin User:** username: `admin`, password: `admin123`
- **Create a new user** account or use admin credentials

## 📋 What You Can Do

### As Admin
- ✅ Create new user accounts
- ✅ View all registered users
- ✅ Delete user accounts
- ✅ Manage the system

### As Regular User
- ✅ Create hiking itineraries
- ✅ Select Malaysian mountains
- ✅ Plan multi-day hikes
- ✅ Choose public transport routes
- ✅ View all your itineraries
- ✅ Edit itineraries
- ✅ Delete itineraries

## 🏔️ Malaysian Mountains Available
1. Gunung Kinabalu
2. Gunung Tahan
3. Gunung Ledang
4. Gunung Semporna
5. Gunung Irau
6. Gunung Jerai
7. Gunung Rajah

## 🚌 Transport Methods
- Bus
- Train
- Taxi/Grab
- Combined (Bus + Train)
- Self Drive

## 📁 Project Structure
```
GunungClimber/
├── server/           ← Express backend (port 5000)
├── client/          ← React frontend (port 3000)
├── db/              ← SQLite database storage
└── README.md        ← Full documentation
```

## 🔐 Security
- Default admin password: `admin123`
- ⚠️ Change this in production (.env file)
- All passwords are securely hashed
- JWT token authentication

## 📝 Next Steps
1. Run `npm run setup` to install everything
2. Start the backend with `npm run dev`
3. Start the frontend with `npm run client`
4. Visit http://localhost:3001
5. Login and start planning hikes!

## 🆘 Troubleshooting
- Port 5000 in use? Change PORT in `.env`
- Database errors? Delete `db/gunungclimber.db` and run setup again
- CORS errors? Ensure both servers are running

## 📚 Documentation
See `README.md` for complete documentation, API endpoints, and advanced setup.
