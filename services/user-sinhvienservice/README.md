# CampusLearning Student Service API

The **CampusLearning Student Service** provides RESTful endpoints that power the HUBT student mobile/web applications. It handles profile data, academic information, schedules, tuition, course registration and more.

---

## Table of Contents
1. [Features](#features)
2. [Tech-Stack](#tech-stack)
3. [Requirements](#requirements)
4. [Setup](#setup)
5. [Scripts](#scripts)
6. [Environment Variables](#environment-variables)
7. [Folder Structure](#folder-structure)
8. [License](#license)

---

## Features
• **JWT Authentication** – Secure access tokens with refresh logic.  
• **Profile & Academic APIs** – Retrieve and update student profile, program and grades.  
• **Schedule & Exam Registration** – Daily timetable, exam slots & online registration.  
• **Tuition & Payments** – Tuition fee breakdown, payment history & mock payment gateway.  
• **Notifications** – Push and pull notifications endpoint.  
• **Demo Mode** – Service starts with mock data when SQL Server is unreachable.

## Tech-Stack
* **Node.js 18** + **Express 4**  
* **MSSQL** via `mssql` driver & connection pool  
* **dotenv**, **helmet**, **cors**, **compression**, **morgan**  
* **express-validator** for request validation  
* **jsonwebtoken** for auth  

## Requirements
| Software | Version |
| -------- | ------- |
| Node.js  | >= 16 |
| SQL Server | 2017+ |

## Setup
```bash
# 1. Clone repository
$ git clone https://github.com/your-org/CampusLearning.git
$ cd CampusLearning/services/user-sinhvienservice

# 2. Install dependencies
$ npm install

# 3. Configure environment variables
$ cp .env.example .env
$ nano .env

# 4. Run database migrations / import sample data (optional)
$ sqlcmd -S localhost -i datasinhvien.sql

# 5. Start the server
$ npm run dev   # nodemon
```
The API will be available on `http://localhost:5008/api` by default.

## Scripts
Script | Description
------ | -----------
`npm run dev` | Start server with **nodemon** & demo mode toggle
`npm start` | Start server in production mode
`npm test` | Placeholder for test runner
`npm run lint` | Run ESLint

## Environment Variables
```
# Server
PORT=5008
NODE_ENV=development

# Database
DB_USER=sa
DB_PASSWORD=YourStrongPassword!
DB_SERVER=localhost
DB_NAME=CampusLearning
DB_ENCRYPT=false

# Auth
JWT_SECRET=SuperSecretJWTKey
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:3000

# Misc
DEMO_MODE=false
LOG_LEVEL=info
```

## Folder Structure
```
user-sinhvienservice/
├── src/
│   ├── config/        # app.js & database.js
│   ├── controllers/   # Business logic
│   ├── middleware/    # Auth & error handling
│   ├── models/        # SQL queries
│   ├── routes/        # Express routers
│   ├── utils/
│   └── app.js         # Express app setup
├── index.js           # HTTP server wrapper
└── run.sh             # Helper script for dockerised run
```

## License
Distributed under the **MIT** License. 