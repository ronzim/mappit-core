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

### High Priority Improvements

#### 1. **Security Enhancements**
- **Issue**: Current implementation uses `nodeIntegration: true` and `contextIsolation: false`
- **Risk**: Potential XSS vulnerabilities if rendering untrusted content
- **Solution**: 
  - Implement `contextBridge` and preload scripts
  - Enable `contextIsolation: true`
  - Disable `nodeIntegration`
  - Use IPC for all main-renderer communication
- **Impact**: Critical for any future web-facing features

#### 2. **Mapbox Access Token Security**
- **Issue**: Hardcoded Mapbox token in `index.html`
- **Risk**: Token exposure in version control
- **Solution**:
  - Move token to environment variable or config file
  - Add config file to .gitignore
  - Provide example config template
- **Impact**: Prevents token abuse and follows best practices

#### 3. **Error Handling Improvements**
- **Issue**: Limited error handling in async operations and data processing
- **Current**: Basic try-catch in main, minimal validation
- **Solution**:
  - Add comprehensive error handling throughout data pipeline
  - Validate file existence before loading
  - Provide user-friendly error messages
  - Handle malformed JSON gracefully
- **Impact**: Better user experience and debugging

#### 4. **Testing Infrastructure**
- **Issue**: No formal test suite (package.json shows "Error: no test specified")
- **Current**: Only basic test_data.js script
- **Solution**:
  - Add Jest or Mocha test framework
  - Create unit tests for data.js, utils.js, plot.js
  - Add integration tests for full pipeline
  - Set up CI/CD for automated testing
- **Impact**: Ensures reliability and prevents regressions

### Medium Priority Improvements

#### 5. **Performance Optimization**
- **Issue**: README notes "heatmaps over 10k pts has performance issues"
- **Solution**:
  - Implement data clustering/aggregation for large datasets
  - Add progressive rendering
  - Consider deck.gl migration (already in roadmap)
  - Implement data sampling options for preview
- **Impact**: Better performance with large datasets

#### 6. **Progress Indicators**
- **Issue**: Long-running operations provide limited feedback
- **Already Noted in Roadmap**: "Show progress bar"
- **Solution**:
  - Add cli-progress for data loading and filtering
  - Show estimated time remaining
  - Display operation stages (loading, filtering, preparing, rendering)
- **Impact**: Improved user experience during long operations

#### 7. **Spatial Filtering**
- **Issue**: Marked as TODO in code
- **Solution**:
  - Implement `--filterspace` CLI argument
  - Add bounding box validation
  - Create utility function for spatial filtering
- **Impact**: More flexible data exploration

#### 8. **Code Organization**
- **Issue**: All utilities mixed in single files
- **Solution**:
  - Split utils.js into geo-utils.js and array-utils.js
  - Consider separating plot types into individual files
  - Add JSDoc comments for better documentation
- **Impact**: Improved maintainability

### Low Priority / Polish

#### 9. **Documentation Enhancements**
- Add API documentation with JSDoc
- Create CONTRIBUTING.md for contributors
- Add examples directory with sample commands
- Document Mapbox style options
- Add troubleshooting section to README

#### 10. **Configuration System**
- Create config.json for default settings
- Allow users to customize:
  - Default zoom levels
  - Map styles
  - Color schemes
  - Output directories

#### 11. **CLI Improvements**
- Add `--version` flag
- Add `--help` with detailed usage
- Support glob patterns for multiple input files
- Add `--output-format` for different export types (GeoJSON, CSV)

#### 12. **Data Validation**
- Validate location coordinates are within valid ranges
- Check for and handle missing required fields
- Add data quality metrics (accuracy distribution, gaps in timeline)

#### 13. **Visualization Enhancements**
- Add time-based animation (playback through time)
- Implement activity-based filtering and coloring
- Add legend to plots
- Support custom markers/icons for different activity types
- Add distance/speed statistics overlay

#### 14. **Dependency Updates**
- **Current**: Electron 9.4.0 (2020, has known vulnerabilities)
- **Recommended**: Update to latest Electron (33.x as of 2024)
- Update other dependencies for security patches
- Consider using npm audit to identify vulnerabilities

#### 15. **Code Quality Tools**
- Add ESLint for code linting
- Add Prettier for code formatting
- Add husky for pre-commit hooks
- Set up .editorconfig for consistent coding style

#### 16. **Build and Distribution**
- Add electron-builder for packaging
- Create platform-specific installers (Windows, Mac, Linux)
- Set up release automation
- Add app icons and branding

#### 17. **Additional Plot Types**
- Implement "byactivitytype" plot (mentioned but not implemented)
- Add trip segmentation visualization
- Add timeline chart showing activity distribution
- Create summary statistics dashboard

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
