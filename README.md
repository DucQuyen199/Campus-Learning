# CampusLearning - Monorepo

A unified repository containing all frontend applications and backend services for the CampusLearning platform.

---

## Repository Map

### Frontend Apps
- [User App](frontend/user-app/README.md) – Main student interface
- [Student Web App](frontend/user-sinhvienapp/README.md) – HUBT-specific student portal
- [Teacher App](frontend/teacher-app/README.md) – Instructor dashboard
- [Admin App](frontend/admin-app/README.md) – System administration UI
- [Student Admin App](frontend/admin-sinhvienapp/README.md) – Student record management

### Backend Services
- [User Service](services/user-service/README.md)
- [Student Service](services/user-sinhvienservice/README.md)
- [Teacher Service](services/teacher-service/README.md)
- [Admin Service](services/admin-service/README.md)
- [Student Admin Service](services/admin-sinhvienservice/README.md)
- [Judge0 Master](services/judge0-master/README.md) – Code runner
- [Code-Server](services/code-server/README.md) – Browser IDE

---

## Quick Start (Local Dev)
```bash
# 1. Clone
$ git clone https://github.com/your-org/campuslearning.git
$ cd campuslearning

# 2. Install workspace tools (optional; pnpm recommended)
$ pnpm install -r  # or use npm in each sub-folder

# 3. Run a frontend app
$ cd frontend/user-app && npm run dev

# 4. Run a backend service
$ cd services/user-service && npm run dev
```

See each sub-project’s README for detailed setup & env vars.

---

© 2024 CampusLearning.
