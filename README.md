# CampusLearning - Monorepo

A unified repository containing all frontend applications and backend services for the CampusLearning platform.

---

## 🗺 Repository Map

### 🎨 Frontend Apps

* [User App](frontend/user-app/README.md) – Main student interface
* [Student Web App](frontend/user-sinhvienapp/README.md) – Campus Learning-specific student portal
* [Teacher App](frontend/teacher-app/README.md) – Instructor dashboard
* [Admin App](frontend/admin-app/README.md) – System administration UI
* [Student Admin App](frontend/admin-sinhvienapp/README.md) – Student record management

### 🧠 Backend Services

* [User Service](services/user-service/README.md)
* [Student Service](services/user-sinhvienservice/README.md)
* [Teacher Service](services/teacher-service/README.md)
* [Admin Service](services/admin-service/README.md)
* [Student Admin Service](services/admin-sinhvienservice/README.md)
* [Judge0 Master](services/judge0-master/README.md) – Code runner
* [Code-Server](services/code-server/README.md) – Browser IDE

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Clone the repo
$ git clone https://github.com/DucQuyen199/Campus-Learning.git
$ cd campuslearning

# 2. Install workspace tools (pnpm recommended)
$ pnpm install -r  # or use npm in each sub-folder

# 3. Run a frontend app
$ cd frontend/user-app && npm run dev

# 4. Run a backend service
$ cd services/user-service && npm run dev
```

> 📌 Check each sub-project’s README for detailed setup and environment configuration.

---

## 💖 Support Me

This project is built and maintained by [**Nguyen Duc Quyen**](https://github.com/DucQuyen199) to empower modern digital learning platforms. If you find this project helpful and want to support its continued development:

- ⭐ Star this repository  
- 📣 Share it with your friends or community  
- 💸 Donate via MB Bank QR (Account: **9999991909 – Nguyen Duc Quyen**):

<p align="center">
  <img src="https://iili.io/F8JsIef.png" alt="Donate via MB Bank QR" width="300" />
</p>

Your support keeps the project alive and evolving!

---

© 2025 CampusLearning. All rights reserved.
