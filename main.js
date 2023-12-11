const { app, BrowserWindow } = require("electron");
const url = require("url");
const path = require("path");
let mainWindow;
let defaultwidth = 1200;
let defaultheight = 700;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: defaultwidth,
    height: defaultheight,
    minWidth: defaultwidth,
    minHeight: defaultheight,
    icon: "src/assets/icons/m.ico", // sets window icon
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `/dist/index.html`),
      protocol: "file:",
      slashes: true,
    })
  );
  mainWindow.setMenu(null);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  if (mainWindow === null) createWindow();
});
