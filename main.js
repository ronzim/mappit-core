const { app, BrowserWindow, screen } = require("electron");
const { prepareData, applyFilters } = require("./deps/geo_plot.js");
const loader = require("./deps/loader.js");

const argv = require("yargs").array("filterdate").array("filterspace").argv;

// IMPLEMENTED CLI COMMANDS:
// --loadfile : load positions from file
// --filterdate [start, end] : filter by date
// --TODO filterspace [lat_max, lat_min, lng_max, lng_min] : filter by position
// --plot byActivityType/byVelocity/heatmap : prepare data to be rendered in each format
// --render : render plot using electron
// --TODO outfile : write filtered data to file

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

function prepare() {
  console.log("preparing...");
  console.log(argv);

  let data = loader.load(argv.loadfile); // "./Takeout/location_history/location_history.json";

  console.log(data);

  let filterData = argv.filterdate
    ? applyFilters(data, "date", argv.filterdate)
    : data.locations;

  let plotData = prepareData(filterData, argv.plot);

  if (argv.render) {
    createWindow(plotData);
  } else {
    app.quit();
  }
}

// function plot(input) {
//   const Plotly = require("plotly.js-dist");

//   Plotly.setPlotConfig({
//     mapboxAccessToken:
//       "pk.eyJ1Ijoicm9uemltIiwiYSI6ImNqdDdtOWIzZDBmODA0OWp6bThxbGZhYXgifQ.t4KKKWA-zOe6OLzFhuT0bw"
//   });
//   Plotly.newPlot("graph-container", input.data, input.layout);
// }

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(prepare);

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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
