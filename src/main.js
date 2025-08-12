const { app, BrowserWindow, screen } = require("electron");
const fs = require("fs-extra");
const { prepareData } = require("./plot.js");
const { loadData, filterData, simplifyData } = require("./data.js");

const argv = require("yargs").array("filterdate").array("filterspace").argv;

// IMPLEMENTED CLI COMMANDS:
// --loadfile : load positions from file
// --filterdate [start, end] : filter by date
// --TODO filterspace [lat_max, lat_min, lng_max, lng_min] : filter by position
// --plot byactivitytype/byvelocity/heatmap : prepare data to be rendered in each format
// --render : render plot using electron
// --writeOutput : write filtered data to file

// ACTUAL LIMITS:
// - heatmaps over 10k pts has performance issues (implement clustering)

function createWindow(data) {
  // Get screen dimensions
  var mainScreen = screen.getPrimaryDisplay();
  // var allScreens = screen.getAllDisplays();
  console.log(mainScreen);
  console.log("filters", argv, argv.filter);

  // Create the browser window.
  let win = new BrowserWindow({
    width: mainScreen.workAreaSize.width,
    height: mainScreen.workAreaSize.height,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  win.loadFile("index.html");

  // Open the DevTools.
  win.webContents.openDevTools();

  win.webContents.on("did-finish-load", () => {
    win.webContents.send("ping", data);
  });
}

async function main() {
  console.log("starting...");
  console.log(argv);

  const rawData = await loadData(argv.loadfile);

  const filteredData = filterData(rawData, argv.filterdate);

  if (argv.writeOutput) {
    const simplifiedData = simplifyData(filteredData);
    fs.writeJsonSync(argv.writeOutput, { locations: simplifiedData });
  }

  if (argv.render) {
    const plotData = prepareData(filteredData, argv.plot);
    createWindow(plotData);
  } else {
    app.quit();
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(main);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
