# MappIt Core - Repository Documentation

## Repository Summary

**MappIt Core** is a Node.js-based desktop application for visualizing and analyzing Google Location History data. Built with Electron, it provides a command-line interface to load, filter, and render large-scale location datasets exported from Google Takeout.

### Key Features
- **Big Data Handling**: Processes JSON files larger than 500MB using streaming parsers
- **Date Filtering**: Filter location records by date ranges
- **Multiple Visualization Modes**: 
  - Raw scatter plots
  - Velocity-based color coding
  - Heatmap visualization
- **Data Export**: Simplify and export filtered location data
- **Interactive Maps**: Uses Plotly.js with Mapbox for interactive map rendering

### Technology Stack
- **Runtime**: Node.js with Electron for desktop GUI
- **Visualization**: Plotly.js with Mapbox integration
- **Data Processing**: big-json and stream-json for handling large files
- **CLI**: yargs for command-line argument parsing
- **Utilities**: simple-statistics for statistical operations

### Use Case
This tool is designed for users who want to explore and visualize their Google Location History data locally without uploading it to cloud services. It's particularly useful for:
- Travel pattern analysis
- Location timeline visualization
- Personal data exploration and privacy-conscious analysis
- Exporting filtered/simplified location datasets

---

## Repository Map

### Root Directory Structure

```
mappit-core/
├── src/                    # Source code directory
│   ├── main.js            # Electron entry point and CLI orchestration
│   ├── data.js            # Data loading, filtering, and simplification
│   ├── plot.js            # Visualization data preparation
│   ├── utils.js           # Utility functions (distance, mean, etc.)
│   └── defaults.js        # Color scales and configuration defaults
├── index.html             # Electron window HTML template
├── package.json           # NPM dependencies and scripts
├── package-lock.json      # Locked dependency versions
├── README.md              # User documentation and usage guide
├── LICENSE                # MIT License
├── .gitignore            # Git ignore rules (node_modules, Takeout)
├── Records.json           # Sample location data for testing
├── simplified_data.json   # Sample output file
└── test_data.js          # Simple test script
```

### Source Code Overview

#### `src/main.js` (102 lines)
**Purpose**: Application entry point and orchestration
- Initializes Electron app
- Parses CLI arguments using yargs
- Coordinates data loading, filtering, plotting, and rendering
- Creates browser window with appropriate security settings
- Manages app lifecycle events

**Key CLI Commands**:
- `--loadfile`: Load locations from file
- `--filterdate [start, end]`: Filter by date range
- `--plot byvelocity/heatmap`: Select visualization mode
- `--render`: Render plot in Electron window
- `--writeOutput`: Write filtered data to file

**Security Note**: Currently uses `nodeIntegration: true` which is noted in code as acceptable for local-only tool but should be refactored.

#### `src/data.js` (92 lines)
**Purpose**: Data loading and manipulation
- `loadData()`: Streams and parses large JSON files using big-json
- `filterData()`: Filters locations by date range with validation
- `simplifyData()`: Reduces data size by extracting essential fields
- `printFileStats()`: Displays dataset statistics

**Data Format**: Handles Google Location History JSON with locations array containing:
- timestamp (ISO string)
- latitudeE7/longitudeE7 (E7 format: degrees × 10^7)
- velocity, heading, altitude, accuracy
- activity array with type and confidence

#### `src/plot.js` (164 lines)
**Purpose**: Visualization data preparation for Plotly
- `prepareData()`: Router function for plot type selection
- `plotByVelocity()`: Creates velocity-colored scatter plot
- `scatterRaw()`: Basic scatter plot of all points
- `plotHeatmap()`: Generates density heatmap using densitymapbox

**Plot Characteristics**:
- Auto-centers map on data mean coordinates
- Configurable zoom, bearing, and pitch
- Multiple Mapbox styles (dark, satellite-streets, outdoors)
- Custom colorscales for different visualizations

#### `src/utils.js` (58 lines)
**Purpose**: Mathematical and geographical utilities
- `degToRad()`: Degree to radian conversion
- `distance()`: Haversine formula for Earth distance calculation
- `countNearbyPoints()`: Finds points within 1km radius
- `normalize()`: Normalizes array to 0-100 scale
- `mean()`: Calculates array average

#### `src/defaults.js` (45 lines)
**Purpose**: Configuration constants
- Color scales (custom and viridis-modified)
- Activity type to color mapping
- Layout margin defaults

#### `index.html` (28 lines)
**Purpose**: Electron renderer process template
- Imports and configures Plotly with Mapbox token
- IPC communication setup to receive plot data from main process
- Simple full-screen graph container

#### `test_data.js` (12 lines)
**Purpose**: Basic test script
- Loads sample Records.json
- Filters to a specific time range
- Exports simplified data

---

## Improvement Suggestions

For detailed improvement suggestions and prioritized recommendations, see [suggestions.md](suggestions.md).

---

## Architecture Strengths

1. **Clean Separation of Concerns**: Data, plotting, and UI logic are well-separated
2. **Streaming Data Processing**: Smart use of big-json for handling large files
3. **CLI-First Design**: Enables automation and scripting
4. **Mapbox Integration**: Professional-quality map rendering
5. **Simple Deployment**: Single npm install, no complex setup

---

## Quick Start for Contributors

### Prerequisites
- Node.js 12+ 
- npm

### Setup
```bash
npm install
```

### Run Example
```bash
npm start -- --loadfile ./Records.json --filterdate '2022-08-06' '2022-08-17' --plot heatmap --render
```

### Testing
```bash
node test_data.js
```

---

## Data Privacy Notes

- All processing happens locally
- No data sent to external services (except Mapbox for tiles)
- Mapbox token in code should be replaced for production use
- Users maintain full control of their location data

---

## Future Roadmap Items (from README)

- [x] Manage big json data (bigger than 500 MB) ✅
- [ ] Replace plotly with deck.gl (for better performance)
- [ ] Download canvas and result data
- [ ] Show progress bar (cli-progress)
- [ ] Reworking plot types
- [ ] Merge multiple Records.json files

---

## License

MIT License - Copyright (c) 2020 D/Vision Lab

---

*Last Updated: 2026-02-16*
*Repository: ronzim/mappit-core*
*Lines of Code: ~461 (excluding dependencies)*
