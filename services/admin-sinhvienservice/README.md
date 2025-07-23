# Campust Admin Student Service API

The **Campust Admin Student Service** exposes REST endpoints for university administrators to manage student datasets, academic structures, finance & services. It backs the **Student Admin Portal** frontend.

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
• **Authentication & RBAC** – JWT tokens, admin/staff roles.  
• **Student CRUD** – Create, update, deactivate, delete students.  
• **Academic Catalogue** – Degrees, majors, courses and semesters endpoints.  
• **Finance Module** – Tuition fees, payments, debt tracking.  
• **Bulk CSV Import/Export** – Import students & scores via CSV.  
• **Service Desk** – Manage online service requests from students.

## Tech-Stack
* **Node.js 18** + **Express 4**  
* **MSSQL** with connection pooling (`mssql`)  
* **dotenv**, **helmet**, **cors**, **morgan**, **multer**  
* **bcrypt / bcryptjs** for password hashing  
* **jsonwebtoken** for authentication

## Requirements
| Software | Version |
| -------- | ------- |
| Node.js  | >= 16 |
| SQL Server | 2017+ |

## Setup
```bash
# 1. Clone repository
$ git clone https://github.com/your-org/campust.git
$ cd campust/services/admin-sinhvienservice

# 2. Install dependencies
$ npm install

# 3. Configure environment
$ cp .env.example .env
$ nano .env   # edit variables (see below)

# 4. Seed database (optional)
$ sqlcmd -S localhost -i datasinhvien.sql

# 5. Start dev server
$ npm run dev
```
Service listens on `http://localhost:5011` by default.

## Scripts
Script | Description
------ | -----------
`npm run dev` | Start with **nodemon**
`npm start` | Run in production mode

## Environment Variables
```
PORT=5011
NODE_ENV=development

# Database
DB_USER=sa
DB_PASSWORD=YourStrongPassword!
DB_SERVER=localhost
DB_NAME=campushubt
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# JWT
JWT_SECRET=AdminServiceSecret
JWT_EXPIRES_IN=1d

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Folder Structure
```
admin-sinhvienservice/
├── src/
│   ├── config/db.js    # DB helper
│   ├── routes/         # Express routers (students, users, academic, ...)
│   ├── controllers/
│   └── docs/           # API docs / Swagger (if available)
├── routes/             # Legacy routes
├── datasinhvien.sql    # Sample dataset
├── server.js           # Express bootstrap
└── package.json
```

## License
Distributed under the **MIT** License. 