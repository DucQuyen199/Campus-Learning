# Campust Student Web App

The **Campust Student Web App** is the primary portal for HUBT students to access courses, schedules, grades and campus-wide services. Built with **React (Create React App)** and **Material-UI**, it delivers a fast, responsive experience across modern browsers.

---

## Table of Contents
1. [Features](#features)
2. [Tech-Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Available Scripts](#available-scripts)
5. [Environment Variables](#environment-variables)
6. [Folder Structure](#folder-structure)
7. [Contributing](#contributing)
8. [License](#license)

---

## Features
• **Personal Dashboard** – Overview of GPA, upcoming events and notifications.  
• **Course Registration** – Browse and register for available courses each semester.  
• **Grade Tracking** – View exam results and historical academic performance displayed with charts.  
• **Timetable** – Weekly calendar of classes and exams.  
• **Profile Management** – Update personal information and account security (password, MFA).  

## Tech-Stack
* **React 18** (Create React App)  
* **Material-UI 5** for design system & data-grid tables  
* **Redux Toolkit** & **Redux Thunk** for state management  
* **Axios** for HTTP requests  
* **Chart.js** & **React-Chartjs-2** for visualisations  
* **React Router v6** for client-side routing  
* **Date-Fns** for date utilities  

## Getting Started

### Prerequisites
• **Node.js >= 16**  
• **npm** or **yarn**

### Installation
```bash
# 1. Clone repository
$ git clone https://github.com/your-org/campust.git
$ cd campust/frontend/user-sinhvienapp

# 2. Install dependencies
$ npm install  # or yarn

# 3. Configure environment variables
$ cp .env.example .env
$ nano .env      # set REACT_APP_API_URL, etc.

# 4. Start development server
$ npm start      # or yarn start
```
The app runs on [http://localhost:5009](http://localhost:5009) by default.

## Available Scripts
Script | Description
------ | -----------
`npm start` | Start dev server with hot-reload (alias: `npm run dev`)
`npm run build` | Create an optimized production build under `build/`
`npm test` | Launch test runner (Jest & React Testing Library)
`npm run eject` | Eject CRA configuration (irreversible)

## Environment Variables
Create a `.env` file at project root. Example:
```
REACT_APP_API_URL=http://localhost:5010/api
REACT_APP_SOCKET_URL=http://localhost:5010
```
Only variables prefixed with **REACT_APP_** are exposed to the browser.

## Folder Structure
```
user-sinhvienapp/
├── public/              # Static assets and index.html
├── src/
│   ├── api/             # Axios instances & service functions
│   ├── components/      # Reusable UI components
│   ├── pages/           # Top-level page components (Dashboard, Courses, ...)
│   ├── redux/           # Redux slices & store configuration
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Helper functions
│   └── App.js           # Routing definitions
└── package.json
```

## Contributing
1. Fork the repository & create a feature branch off `main`.  
2. Code with ESLint/Prettier enabled.  
3. Submit a pull request describing your changes.

## License
Distributed under the **MIT** License. 