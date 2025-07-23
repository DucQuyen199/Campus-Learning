# CampusLearning - Admin App

## Overview

The Admin App is a centralized administration interface for the CampusLearning platform. It provides tools to manage users, courses, content, exams, events, competitions, and system configurations. This application is designed for platform administrators, allowing them to monitor and maintain all aspects of the CampusLearning system.

## Key Features

- **User Management**: Administer user accounts, permissions, and roles
- **Course Management**: Create, edit, and oversee courses on the platform
- **Dashboard**: Visualization of metrics, statistics, and KPIs
- **Exam Management**: Create and administer exams and assessments
- **Event Administration**: Organize and monitor platform events
- **Competition Management**: Create and administer programming competitions
- **Reports and Analysis**: Generation of detailed reports and analytics
- **System Configuration**: Global settings and parameters for the platform

## Technologies Used

- **Frontend**: React.js
- **UI Framework**: Material-UI and Ant Design
- **State Management**: Context API
- **Routing**: React Router
- **Forms**: Formik with Yup for validations
- **API Requests**: Axios
- **Data Visualization**: Recharts
- **Rich Text Editor**: React Quill
- **Code Visualization**: React Syntax Highlighter
- **Animations**: Framer Motion

## Installation Requirements

- Node.js 16 or higher
- npm or yarn
- Modern browser (Chrome, Firefox, Safari, Edge)

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/campuslearning.git
   cd campuslearning/frontend/admin-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure environment variables:
   - Copy the `.env.example` file to `.env`
   - Adjust variables according to your environment

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   
   The application will be available at `http://localhost:5005`

## Available Commands

- `npm start` - Start the development server on the default port (3000)
- `npm run dev` - Start the development server on port 5005
- `npm run build` - Build the application for production
- `npm test` - Run tests
- `npm run eject` - Eject Create React App configuration

## Project Structure

```
admin-app/
├── src/
│   ├── api/           # API configuration and endpoints
│   ├── components/    # Reusable components
│   ├── contexts/      # React contexts
│   ├── menu-items/    # Navigation menu configuration
│   ├── pages/         # Main pages
│   │   ├── Courses/       # Course management
│   │   ├── Competitions/  # Competition management
│   │   ├── Dashboard.jsx  # Main dashboard
│   │   ├── Events/        # Event management
│   │   ├── Exams/         # Exam management
│   │   ├── LoginPage.jsx  # Login page
│   │   ├── Reports/       # Reports and analytics
│   │   ├── Settings/      # System configuration
│   │   └── Users/         # User management
│   ├── routes/        # Route configuration
│   ├── services/      # Business logic services
│   ├── store/         # Global state management
│   ├── App.jsx        # Main component
│   └── index.js       # Entry point
└── public/           # Public files
```

## Backend Integration

This application primarily communicates with the admin-service through RESTful APIs. It also interacts with other system services as needed:

- **admin-service**: Main endpoints for administrative functions
- **user-service**: For user management and authentication
- **judge0-master**: For programming competition-related functionalities

## Authentication and Security

The application uses JWT-based authentication with the following features:

- Tokens stored in localStorage or secure cookies
- Automatic token renewal
- Role-based access control
- Protected routes for administrators

## Troubleshooting

### API Connection Issues

If you experience connection issues with the backend:

1. Verify that the admin-service is running
2. Check that the API URLs in the `.env` file are correct
3. Check the console for specific error messages

### Performance Issues

If the application is running slowly:

1. Check resource loading in the Network tab of the developer tools
2. Consider reducing the amount of data loaded in tables and charts
3. Ensure pagination is properly implemented

## Development and Contribution

### Style Guide

The project follows these conventions:

- **Components**: PascalCase for files and component names
- **Functions and Variables**: camelCase for names
- **Constants**: UPPER_SNAKE_CASE for global constants
- **Styles**: Combination of Material-UI and Ant Design with customization

### Development Workflow

1. Create a branch from `develop` for your feature
2. Implement changes following the style guides
3. Ensure all tests pass
4. Submit a Pull Request to the `develop` branch

## License

© 2023 CampusLearning. All rights reserved. 