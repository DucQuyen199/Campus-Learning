# Campust User Application

The **Campust User Application** is the cross-platform (Web, Desktop & Mobile) client for the Campust learning ecosystem.  
It is built with modern web technologies (React + Vite + TailwindCSS) and packaged with Electron (desktop) & Capacitor (mobile) to deliver a native-like experience everywhere.

---

## Table of Contents
1. [Features](#features)
2. [Tech-Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Scripts](#scripts)
5. [Environment Variables](#environment-variables)
6. [Building for Production](#building-for-production)
7. [Folder Structure](#folder-structure)
8. [Contributing](#contributing)
9. [License](#license)

---

## Features
• **AI Chat** – Chat with Google Gemini to get coding help and study tips.  
• **Interactive Code Editor** – Monaco-powered editor with syntax highlighting & run button.  
• **Competitions & Courses** – Solve coding challenges and follow course road-maps while tracking progress.  
• **Real-Time Communication** – Notifications & chat via Socket.IO.  
• **Multi-Platform Packaging** – One code-base, deployable as SPA, Electron desktop app, or native mobile app.

## Tech-Stack
* **React 18** + **Vite 5** – lightning-fast dev server & HMR  
* **TailwindCSS 3** & **Chakra UI / Ant Design** – flexible, accessible UI components  
* **Redux Toolkit** & **React-Query** – predictable state management and server caching  
* **Electron 37** & **Capacitor 7** – packaging for macOS, Windows, Android & iOS  
* **TypeScript** ready (configured – opt-in)  
* **Socket.IO**, **Axios**, **i18next** and much more – see `package.json` for full list.

## Getting Started

### Prerequisites
• **Node.js >= 16**  
• **npm** (comes with Node) or **pnpm / yarn**.

### Installation
```bash
# 1. Clone repository
$ git clone https://github.com/your-org/campust.git
$ cd campust/frontend/user-app

# 2. Install dependencies
$ npm install

# 3. Create environment file
$ cp .env.example .env
$ nano .env  # or any editor
```
Specify the variables described in [Environment Variables](#environment-variables).

### Development server
```bash
npm run dev
```
The app will be available at http://localhost:5173 (default Vite port).

## Scripts
Script | Description
------ | -----------
`npm run dev` | Start Vite dev server with HMR
`npm run build` | Bundle the web SPA into the `dist` dir
`npm run preview` | Preview the production build locally
`npm run lint` | Run ESLint on all project files
`npm run electron:start` | Launch web dev server _and_ Electron shell (desktop dev)
`npm run electron:build:mac` | Create `.dmg` for macOS
`npm run electron:build:win` | Create `.exe` installer for Windows
`npm run electron:build:all` | Build installers for both platforms
`npm run cap:sync` | Build web assets & sync them into native projects
`npm run cap:ios` / `cap:android` | Open Xcode / Android Studio with synced project

## Environment Variables
All runtime configuration lives in an `.env` file at the project root.  
Below is the minimum set required:

| Variable | Description |
| -------- | ----------- |
| `VITE_API_URL` | Base URL of the backend REST API (e.g. `http://localhost:5000/api`) |
| `VITE_SOCKET_URL` | Socket.IO server URL (optional, defaults to `VITE_API_URL`) |
| `VITE_GEMINI_API_KEY` | Your Google Gemini API key to enable AI Chat |
| `VITE_ENVIRONMENT` | `development`, `staging` or `production` (optional) |

> **Tip**: Because all variables are prefixed with **VITE_**, they will be statically injected at build-time by Vite.

## Building for Production
Create a minified web build:
```bash
npm run build
```
Artifacts are written to `dist/` and can be served by any static server.

### Desktop (Electron)
```bash
# macOS
npm run electron:build:mac
# Windows
npm run electron:build:win
```
Installers are output to the `release/` directory as configured in `package.json`.

### Mobile (Capacitor)
```bash
npm run cap:sync      # build & copy web assets
npm run cap:android   # open Android Studio
npm run cap:ios       # open Xcode
```
After opening the native project you can run or archive using the respective IDE.

## Folder Structure
```
user-app/
├── public/          # Static assets
├── src/
│   ├── api/         # API wrappers
│   ├── components/  # Re-usable UI components
│   ├── pages/       # Top-level route components
│   ├── hooks/       # Custom React hooks
│   ├── store/       # Redux Toolkit slices
│   └── utils/       # Shared utilities (incl. codeRunner)
├── electron.cjs     # Electron main process
└── vite.config.js   # Vite configuration
```

## Contributing
1. Fork the repository & create your branch from `main`.  
2. Run `npm run lint` and fix any issues before committing.  
3. Open a PR describing your changes.

## License
Distributed under the **MIT** License. See `LICENSE` for more information. 