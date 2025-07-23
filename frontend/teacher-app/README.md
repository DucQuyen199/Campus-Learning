# Campust Teacher Web App

The **Campust Teacher Web App** empowers instructors to manage classes, publish course materials, evaluate student submissions and monitor progress. It is built with **React** (Create React App) and styled with **TailwindCSS** & **Material-UI**.

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
• **Course Management** – Create, update and archive courses and lessons.  
• **Assignment Builder** – Rich-text editor (Quill) for tasks & instructions.  
• **Grading Dashboard** – Quickly grade submissions and provide feedback.  
• **Real-Time Notifications** – Receive alerts when students submit work (Socket.IO).  
• **Analytics** – Visualize class performance with charts.

## Tech-Stack
* **React 18** (CRA)  
* **TailwindCSS 3** for utility-first styling  
* **Material-UI 5** components  
* **Redux Toolkit** for state management  
* **Axios** for API calls  
* **Socket.IO Client** for real-time features  
* **Formik & Yup** for forms and validation  
* **React-Quill** for rich text editing  

## Getting Started

### Prerequisites
• **Node.js >= 16**  
• **npm** or **yarn**

### Installation
```bash
# 1. Clone repository
$ git clone https://github.com/your-org/campust.git
$ cd campust/frontend/teacher-app

# 2. Install dependencies
$ npm install

# 3. Environment variables
$ cp .env.example .env
$ nano .env   # set REACT_APP_API_URL, REACT_APP_SOCKET_URL

# 4. Start dev server
$ npm start   # or yarn start
```
The app runs on [http://localhost:5006](http://localhost:5006) by default.

## Available Scripts
Script | Description
------ | -----------
`npm start` | Start dev server with Tailwind watch mode (alias: `npm run dev`)
`npm run build` | Production build in `build/`
`npm test` | Launch test runner
`npm run eject` | Eject CRA config (irreversible)

## Environment Variables
```
REACT_APP_API_URL=http://localhost:5010/api
REACT_APP_SOCKET_URL=http://localhost:5010
```

## Folder Structure
```
teacher-app/
├── public/
├── src/
│   ├── components/
│   ├── features/        # Redux slices & business logic
│   ├── pages/
│   ├── hooks/
│   ├── utils/
│   ├── App.js
│   └── index.css        # Tailwind entry
└── tailwind.config.js
```

## Contributing
Pull requests are welcome! Please open an issue first to discuss major changes.

## License
Licensed under the **MIT** License. 