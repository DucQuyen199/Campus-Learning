const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const http = require('http');

let mainWindow;
let splashWindow;

function tryConnect(port, callback) {
  const req = http.get(`http://localhost:${port}`, () => {
    callback(port);
  }).on('error', () => {
    if (port === 5004) {
      tryConnect(5005, callback);
    } else if (port === 5005) {
      tryConnect(3000, callback);
    } else {
      callback(5004); // Default fallback
    }
  });
  req.setTimeout(300);
  req.on('timeout', () => {
    req.destroy();
    if (port === 5004) {
      tryConnect(5005, callback);
    } else if (port === 5005) {
      tryConnect(3000, callback);
    } else {
      callback(5004); // Default fallback
    }
  });
}

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    icon: path.join(__dirname, 'public/favicon.ico')
  });

  splashWindow.loadURL(url.format({
    pathname: path.join(__dirname, app.isPackaged ? 'dist/public/splash.html' : 'public/splash.html'),
    protocol: 'file:',
    slashes: true
  }));

  splashWindow.on('closed', function() {
    splashWindow = null;
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    // Usamos el marco de ventana nativo del sistema operativo
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'public/preload.js')
    },
    icon: path.join(__dirname, 'public/favicon.ico')
  });

  // En producción, carga la aplicación desde la carpeta dist
  if (app.isPackaged) {
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
    finishLoading();
  } else {
    // En desarrollo, conecta al servidor de desarrollo
    tryConnect(5004, (port) => {
      mainWindow.loadURL(`http://localhost:${port}`);
      console.log(`Connected to development server on port ${port}`);
    });
  }

  // Ya no establecemos pantalla completa automáticamente

  function finishLoading() {
    setTimeout(() => {
      // Verificar que splashWindow y mainWindow existen antes de usarlos
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
      }
      // Ya no abrimos las herramientas de desarrollo automáticamente
    }, 2000);
  }

  mainWindow.webContents.on('did-finish-load', finishLoading);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createSplash();
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
}); 