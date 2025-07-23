# CampusLearning Student Admin Portal

The **CampusLearning Student Admin Portal** allows university administrators and staff to manage student records, academic programs, semesters and institutional reports. It is developed with **React** and **Material-UI**, offering an intuitive interface for high-volume data operations.

---

## Table of Contents
1. [Features](#features)
2. [Tech-Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Available Scripts](#available-scripts)
5. [Environment Variables](#environment-variables)
6. [Folder Structure](#folder-structure)
7. [License](#license)

---

## Features
• **Student Management** – Create, update, deactivate or delete student accounts.  
• **Academic Structure** – Maintain degrees, majors, courses and semesters.  
• **Enrollment & Grades** – Record enrollments, enter marks and calculate GPA.  
• **Dashboards & Reports** – Visual statistics through charts and data-grid tables.  
• **Bulk Import / Export** – CSV upload & download for large datasets.  

## Tech-Stack
* **React 18** (Create React App)  
* **Material-UI 5** & **MUI X Data-Grid**  
* **Redux Toolkit** for state handling  
* **Axios** for REST communication  
* **Chart.js** for analytics  
* **Formik & Yup** for forms  

## Getting Started

### Prerequisites
• **Node.js >= 16**  
• **npm** or **yarn**

### Installation
```bash
# 1. Clone repository
$ git clone https://github.com/your-org/CampusLearning.git
$ cd CampusLearning/frontend/admin-sinhvienapp

# 2. Install dependencies
$ npm install  # or yarn

# 3. Configure environment
$ cp .env.example .env
$ nano .env   # set REACT_APP_API_URL

# 4. Start dev server
$ npm start
```
The CRA server proxies API calls to `http://localhost:5011` (see `package.json > proxy`).

## Available Scripts
Script | Description
------ | -----------
`npm start` | Launch development server with hot-reload
`npm run build` | Create production build in `build/`
`npm test` | Run unit tests
`npm run eject` | Eject CRA configuration

## Environment Variables
Only variables prefixed with **REACT_APP_** are exposed in the browser.
```
REACT_APP_API_URL=http://localhost:5011/api
```

## Folder Structure
```
admin-sinhvienapp/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   └── layout/
│   ├── contexts/
│   ├── hooks/
│   ├── pages/
│   │   ├── auth/
│   │   ├── students/
│   │   └── academic/
│   ├── services/
│   ├── styles/
│   ├── utils/
│   ├── App.js
│   └── index.js
└── package.json
```

## License
This project is released under the **MIT** License. 