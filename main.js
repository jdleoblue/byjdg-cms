const { app, BrowserWindow } = require('electron');
const { fork } = require('child_process');
const path = require('path');

let serverProcess;

function createWindow() {

  serverProcess = fork(
    path.join(__dirname, 'cms-server.js')
  );

  const win = new BrowserWindow({
    width: 1600,
    height: 950,
    minWidth: 1200,
    minHeight: 800,
    autoHideMenuBar: true,
    title: 'ByJDG CMS'
  });

  setTimeout(() => {
    win.loadURL('http://localhost:4321');
  }, 1000);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {

  if (serverProcess) {
    serverProcess.kill();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {

  if (serverProcess) {
    serverProcess.kill();
  }
});