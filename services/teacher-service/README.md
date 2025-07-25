# CampusLearning Teacher Service API

The **CampusLearning Teacher Service** is a Node.js/Express REST API that enables instructors to manage courses, assignments, and student data within the CampusLearning learning ecosystem.

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
• **JWT-secured Endpoints** – All routes require signed tokens except authentication.  
• **Course CRUD** – Create, update, archive courses & lessons.  
• **Assignment Workflow** – Upload, list, grade assignments.  
• **Student Roster** – View enrolled students & performance metrics.  
• **SQL Server Connection Pool** with reconnection logic.  
• **Granular Middleware** – Logging, security headers, CORS and rate-limit-ready.

## Tech-Stack
* **Node.js 18** + **Express 4**  
* **MSSQL** driver (`mssql`)  
* **dotenv**, **helmet**, **cors**, **morgan**, **multer** for uploads  
* **jsonwebtoken** for auth  
* **bcrypt** for password hashing

## Requirements
| Software | Version |
| -------- | ------- |
| Node.js  | >= 16 |
| SQL Server | 2017+ |

## Setup
```bash
# 1. Clone repository
$ git clone https://github.com/your-org/CampusLearning.git
$ cd CampusLearning/services/teacher-service

# 2. Install dependencies
$ npm install

# 3. Environment config
$ cp .env.example .env
$ nano .env   # fill variables (see below)

# 4. Start dev server
$ npm run dev
```
Server runs on `http://localhost:5003` by default.

## Scripts
Script | Description
------ | -----------
`npm run dev` | Run with **nodemon** & auto reload
`npm start` | Production mode
`npm test` | Placeholder for tests

## Environment Variables
```
PORT=5003
NODE_ENV=development

# Database
DB_HOST=localhost
DB_NAME=CampusLearning
DB_USER=sa
DB_PASSWORD=YourStrongPassword!

# JWT
JWT_SECRET=TeacherServiceSecret
JWT_EXPIRES_IN=1d

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Folder Structure
```
teacher-service/
├── config/
│   └── database.js     # MSSQL connection & pool helper
├── controllers/
├── middleware/
├── routes/             # auth.routes, course.routes, ...
├── db/                 # SQL scripts / seeds
├── server.js           # Express entry point
└── package.json
```

## License
Released under the **MIT** License. 