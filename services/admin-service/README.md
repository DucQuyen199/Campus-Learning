# Campust Admin Service

The **Campust Admin Service** is a Node.js/Express REST API that powers the administrative dashboard of the Campust learning platform.  
It handles user management, course & event moderation, reporting, file uploads and other privileged operations.

---

## Table of Contents
1. [Features](#features)
2. [Tech-Stack](#tech-stack)
3. [Requirements](#requirements)
4. [Setup](#setup)
5. [Scripts](#scripts)
6. [Environment Variables](#environment-variables)
7. [Folder Structure](#folder-structure)
8. [API Overview](#api-overview)
9. [Deployment](#deployment)
10. [License](#license)

---

## Features
• **JWT Authentication** with access & refresh tokens  
• **Role-based Authorization** (only admins can access protected routes)  
• **MS SQL Server** database connection via `mssql` package & connection pool  
• **Secure Defaults** – Helmet, CORS, morgan request logging, and file-size limits  
• **File Uploads** – Images & CSVs stored in the `/uploads` directory  
• Modular **route files** for users, courses, events, competitions, etc.

## Tech-Stack
* **Node.js 18+**  
* **Express 4**  
* **MSSQL** (SQL Server)  
* **JSON Web Tokens (jsonwebtoken)**  
* **dotenv**, **helmet**, **cors**, **morgan**, **multer/express-fileupload**  
* **nodemon** for live-reload in development

## Requirements
| Software | Version |
| -------- | ------- |
| Node.js | >= 16 |
| SQL Server | 2017 or newer |

> NOTE: The service has been tested on macOS using Docker-based SQL Server and on Windows with a local instance.

## Setup
```bash
# 1. Clone repository
$ git clone https://github.com/your-org/campust.git
$ cd campust/services/admin-service

# 2. Install dependencies
$ npm install

# 3. Create environment file
$ cp .env.example .env
$ nano .env  # edit with your DB credentials & secrets

# 4. Start the server (dev)
$ npm run dev
```
Server will start on `http://localhost:5002` by default.

## Scripts
Script | Description
------ | -----------
`npm run dev` | Start the server with **nodemon** & auto-reload
`npm start` | Run the server in production mode (node `server.js`)

## Environment Variables
Put the following keys into `.env` (example values shown):

```
# Server
PORT=5002
NODE_ENV=development

# MSSQL
DB_SERVER=localhost
DB_USER=sa
DB_PASSWORD=YourStrongPassword!
DB_NAME=campust

# JWT
JWT_SECRET=SuperSecretJWTKey
JWT_REFRESH_SECRET=AnotherRefreshSecretKey
```

> 🔒 **Keep your secrets safe!** Never commit `.env` files or plain-text credentials to version control.

## Folder Structure
```
admin-service/
├── config/
│   └── database.js     # MSSQL connection pool
├── controllers/        # Business logic for each resource
├── routes/             # Express routers (auth, courses, users, ...)
├── middleware/         # Auth, CORS & other middlewares
├── uploads/            # Uploaded files (served statically)
├── server.js           # Application entry point
└── package.json
```

## API Overview
Base URL: `http://<host>:<port>/api`

Endpoint | Description | Auth
-------- | ----------- | ----
`POST /auth/login` | Obtain access & refresh token | No
`POST /auth/register` | Create an admin account | No (optionally restricted)
`POST /refresh` | Exchange refresh token for new access token | No
`GET /courses` | List courses | Admin
`POST /courses` | Create course | Admin
`GET /events` | List events | Admin
`GET /users` | List users | Admin
`...` | etc. | Admin

> Detailed Swagger / Postman collection will be added in future releases.

## Deployment
1. **Build image** using Docker or install Node.js on the target server.  
2. Ensure SQL Server is reachable from the container/host.  
3. Set environment variables (see above).  
4. Start the service with a process manager such as **PM2** or **Docker Compose**.

```bash
npm install -g pm2
npm run build   # optional transpilation step if you add TypeScript
pm2 start server.js -n admin-service
```

## License
Released under the **MIT** License. 