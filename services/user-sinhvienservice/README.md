# User Sinh Viên Service

## Overview
This service provides API endpoints for student profile and academic information management. It follows standard Express.js architecture patterns and best practices.

## Architecture

The application follows the MVC (Model-View-Controller) pattern with a clean, modular structure:

```
src/
├── config/           # Configuration settings
│   ├── app.js        # App configuration
│   └── database.js   # Database configuration
├── controllers/      # API route handlers
│   ├── profileController.js
│   └── academicController.js
├── middleware/       # Express middleware
│   ├── auth.js       # Authentication middleware
│   └── errorHandler.js # Error handling middleware
├── models/           # Data models with SQL queries
│   ├── profile.js
│   └── academic.js
├── routes/           # API route definitions
│   ├── profileRoutes.js
│   └── academicRoutes.js
├── utils/            # Utility functions
├── app.js            # Express app setup
└── server.js         # Server entry point
```

## API Endpoints

### Profile API
- `GET /api/profile/:userId` - Get student profile
- `GET /api/profile/:userId/academic` - Get student academic information
- `GET /api/profile/:userId/metrics` - Get student metrics
- `PUT /api/profile/:userId` - Update student profile
- `GET /api/profile/:userId/updates` - Get profile update history

### Academic API
- `GET /api/academic/program/:userId` - Get student's academic program details
- `GET /api/academic/courses/:programId` - Get student's courses in program
- `GET /api/academic/grades/:userId` - Get student's academic results (grades)
- `GET /api/academic/conduct/:userId` - Get student's conduct scores
- `GET /api/academic/warnings/:userId` - Get student's academic warnings
- `GET /api/academic/metrics/:userId` - Get student's academic metrics
- `GET /api/academic/registered-courses/:userId` - Get student's registered courses

## Getting Started

### Prerequisites
- Node.js 14.x or higher
- npm or yarn
- SQL Server instance

### Installation
1. Clone the repository
2. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5008
   NODE_ENV=development
   DB_USER=sa
   DB_PASSWORD=your_password
   DB_SERVER=localhost
   DB_NAME=campushubt
   JWT_SECRET=your-secret-key
   ```
3. Install dependencies:
   ```
   npm install
   ```

### Running the application
```
npm start        # For production
npm run dev      # For development with hot reload
```

Or use the convenient script:
```
./run.sh
```

## Error Handling
The application has centralized error handling through the errorHandler middleware. All controllers use try/catch blocks and pass errors to the next middleware.

## Authentication
JWT-based authentication is implemented through the auth middleware. To access protected routes, include a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Demo Mode
If the SQL Server connection fails, the application falls back to a "demo mode" that provides mock data for essential endpoints.

## License
This project is proprietary and confidential. 