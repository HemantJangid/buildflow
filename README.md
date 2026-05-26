# BuildFlow - Attendance Management System

A full-stack MERN (MongoDB, Express, React, Node.js) application for managing worker attendance with geofencing capabilities.

## Features

- **JWT Authentication**: Custom authentication with role-based access control (Admin, Manager, Supervisor)
- **Geofencing**: Haversine formula-based location verification for clock-ins
- **Worker Management**: Admin dashboard to manage workers and their metadata (daily rates, visa costs, transport costs)
- **Project Management**: Create projects with GPS coordinates and geofence radius
- **Attendance Tracking**: Clock-in/clock-out with location verification
- **Cost Reports**: Generate worker cost reports combining daily rates with attendance logs
- **Mobile-Friendly**: Responsive design optimized for supervisor mobile clock-ins

## Project Structure

```
buildflow/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js      # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── attendanceController.js
│   │   │   ├── projectController.js
│   │   │   └── reportController.js
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT authentication
│   │   │   └── validate.js      # Request validation
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Project.js
│   │   │   └── Attendance.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── attendanceRoutes.js
│   │   │   ├── projectRoutes.js
│   │   │   └── reportRoutes.js
│   │   ├── utils/
│   │   │   └── geofence.js      # Haversine formula implementation
│   │   └── server.js
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Alert.jsx
    │   │   ├── Button.jsx
    │   │   ├── Card.jsx
    │   │   ├── Input.jsx
    │   │   ├── Layout.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   └── Select.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── ClockIn.jsx
    │   │   ├── Workers.jsx
    │   │   ├── Projects.jsx
    │   │   └── Reports.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    └── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
```

Create `.env` file (or use the existing one):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/buildflow
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
```

Seed (fresh DB – permissions + default org + admin):
```bash
npm run seed
```
Optional: `npm run seed:permissions` (permissions only), `npm run seed:admin` (default org + admin), `npm run seed:demo` (demo users/projects in default org).

Start the server:
```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000` and proxy API requests to the backend.

### Docker Setup (recommended for new contributors)

Start the full stack (MongoDB + API + Web) with a single command:

```bash
docker compose up
```

This starts:
- **MongoDB 7** on port 27017 (data persists in a named volume)
- **API server** on port 5001
- **Web dev server** on port 5173 (proxies `/api` to the API container)

Open http://localhost:5173 in your browser. Then seed the database:

```bash
docker compose exec api node apps/api/src/scripts/seedBootstrap.js
```

To bring everything down (data is preserved):
```bash
docker compose down
```

To bring everything down and delete the data volume:
```bash
docker compose down -v
```

#### Test MongoDB

A separate MongoDB instance for integration tests is available via the test override:

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up
```

This overrides the API to use a test database (`buildflow_test`) on a separate MongoDB instance (port 27018).

## Default Credentials

After running `npm run seed` (bootstrap):
- **Email**: admin@buildflow.com
- **Password**: admin123
- **Role**: ADMIN

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (Admin only)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - Get all users (Admin/Manager)
- `PUT /api/auth/users/:id/metadata` - Update user metadata (Admin)

### Attendance
- `POST /api/attendance/clock-in` - Clock in with geofence check
- `POST /api/attendance/clock-out` - Clock out
- `GET /api/attendance/my-attendance` - Get user's attendance
- `GET /api/attendance` - Get all attendance (Admin/Manager)
- `PUT /api/attendance/:id/metadata` - Update attendance metadata

### Projects
- `POST /api/projects` - Create project (Admin/Manager)
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `PUT /api/projects/:id` - Update project (Admin/Manager)
- `DELETE /api/projects/:id` - Deactivate project (Admin)

### Reports
- `GET /api/reports/worker-cost/:id` - Get worker cost report
- `GET /api/reports/project/:id` - Get project attendance report

## Database Schemas

### User
```javascript
{
  name: String,
  email: String,
  password: String (hashed),
  role: ['ADMIN', 'MANAGER', 'SUPERVISOR'],
  metadata: {
    dailyRate: Number,
    visaCost: Number,
    visaExpiry: Date,
    transportCost: Number,
    fixedExtras: Number
  }
}
```

### Project
```javascript
{
  name: String,
  location: { lat: Number, lng: Number },
  radius: Number (default: 100 meters),
  description: String,
  isActive: Boolean
}
```

### Attendance
```javascript
{
  userId: ObjectId,
  projectId: ObjectId,
  clockIn: Date,
  clockOut: Date,
  coordinates: { lat: Number, lng: Number },
  metadata: {
    workUnits: Number,
    workType: String,
    extraSiteExpenses: Number
  },
  status: ['CLOCKED_IN', 'CLOCKED_OUT']
}
```

## Technologies Used

### Backend
- Express.js - Web framework
- MongoDB with Mongoose - Database
- JWT (jsonwebtoken) - Authentication
- bcryptjs - Password hashing
- express-validator - Request validation

### Frontend
- React 18 - UI library
- React Router v6 - Routing
- Tailwind CSS - Styling
- Axios - HTTP client
- Vite - Build tool

## License

MIT
