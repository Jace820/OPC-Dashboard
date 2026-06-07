const { app, BrowserWindow, spawn } = require('electron');
const path = require('path');
const { spawn: cpSpawn } = require('child_process');
const http = require('http');

let mainWindow;
let serverProcess;

function startServer() {
  return new Promise((resolve) => {
    serverProcess = cpSpawn('python3', [
      path.join(__dirname, '..', '..', 'server.py')
    ], { cwd: path.join(__dirname, '..', '..') });

    const check = () => {
      http.get('http://localhost:8090/api/data', (res) => {
        resolve();
      }).on('error', () => setTimeout(check, 500));
    };
    setTimeout(check, 1000);
  });
}

app.whenReady().then(async () => {
  await startServer();

  mainWindow = new BrowserWindow({
    width: 1280, height: 860,
    minWidth: 800, minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0A0A0F',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  mainWindow.loadURL('http://localhost:8090');
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  app.quit();
});
