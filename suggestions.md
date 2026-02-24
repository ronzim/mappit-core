# MappIt Core - Improvement Suggestions

This document contains prioritized suggestions for improving the MappIt Core codebase.

---

## High Priority Improvements

### 1. **Security Enhancements**
- **Issue**: Current implementation uses `nodeIntegration: true` and `contextIsolation: false`
- **Risk**: Potential XSS vulnerabilities if rendering untrusted content
- **Solution**: 
  - Implement `contextBridge` and preload scripts
  - Enable `contextIsolation: true`
  - Disable `nodeIntegration`
  - Use IPC for all main-renderer communication
- **Impact**: Critical for any future web-facing features

### 2. **Mapbox Access Token Security**
- **Issue**: Hardcoded Mapbox token in `index.html`
- **Risk**: Token exposure in version control
- **Solution**:
  - Move token to environment variable or config file
  - Add config file to .gitignore
  - Provide example config template
- **Impact**: Prevents token abuse and follows best practices

### 3. **Error Handling Improvements**
- **Issue**: Limited error handling in async operations and data processing
- **Current**: Basic try-catch in main, minimal validation
- **Solution**:
  - Add comprehensive error handling throughout data pipeline
  - Validate file existence before loading
  - Provide user-friendly error messages
  - Handle malformed JSON gracefully
- **Impact**: Better user experience and debugging

### 4. **Testing Infrastructure**
- **Issue**: No formal test suite (package.json shows "Error: no test specified")
- **Current**: Only basic test_data.js script
- **Solution**:
  - Add Jest or Mocha test framework
  - Create unit tests for data.js, utils.js, plot.js
  - Add integration tests for full pipeline
  - Set up CI/CD for automated testing
- **Impact**: Ensures reliability and prevents regressions

---

## Medium Priority Improvements

### 5. **Performance Optimization**
- **Issue**: README notes "heatmaps over 10k pts has performance issues"
- **Solution**:
  - Implement data clustering/aggregation for large datasets
  - Add progressive rendering
  - Consider deck.gl migration (already in roadmap)
  - Implement data sampling options for preview
- **Impact**: Better performance with large datasets

### 6. **Progress Indicators**
- **Issue**: Long-running operations provide limited feedback
- **Already Noted in Roadmap**: "Show progress bar"
- **Solution**:
  - Add cli-progress for data loading and filtering
  - Show estimated time remaining
  - Display operation stages (loading, filtering, preparing, rendering)
- **Impact**: Improved user experience during long operations

### 7. **Spatial Filtering**
- **Issue**: Marked as TODO in code
- **Solution**:
  - Implement `--filterspace` CLI argument
  - Add bounding box validation
  - Create utility function for spatial filtering
- **Impact**: More flexible data exploration

### 8. **Code Organization**
- **Issue**: All utilities mixed in single files
- **Solution**:
  - Split utils.js into geo-utils.js and array-utils.js
  - Consider separating plot types into individual files
  - Add JSDoc comments for better documentation
- **Impact**: Improved maintainability

---

## Low Priority / Polish

### 9. **Documentation Enhancements**
- Add API documentation with JSDoc
- Create CONTRIBUTING.md for contributors
- Add examples directory with sample commands
- Document Mapbox style options
- Add troubleshooting section to README

### 10. **Configuration System**
- Create config.json for default settings
- Allow users to customize:
  - Default zoom levels
  - Map styles
  - Color schemes
  - Output directories

### 11. **CLI Improvements**
- Add `--version` flag
- Add `--help` with detailed usage
- Support glob patterns for multiple input files
- Add `--output-format` for different export types (GeoJSON, CSV)

### 12. **Data Validation**
- Validate location coordinates are within valid ranges
- Check for and handle missing required fields
- Add data quality metrics (accuracy distribution, gaps in timeline)

### 13. **Visualization Enhancements**
- Add time-based animation (playback through time)
- Implement activity-based filtering and coloring
- Add legend to plots
- Support custom markers/icons for different activity types
- Add distance/speed statistics overlay

### 14. **Dependency Updates**
- **Current**: Electron 9.4.0 (2020, has known vulnerabilities)
- **Recommended**: Update to latest Electron (33.x as of 2024)
- Update other dependencies for security patches
- Consider using npm audit to identify vulnerabilities

### 15. **Code Quality Tools**
- Add ESLint for code linting
- Add Prettier for code formatting
- Add husky for pre-commit hooks
- Set up .editorconfig for consistent coding style

### 16. **Build and Distribution**
- Add electron-builder for packaging
- Create platform-specific installers (Windows, Mac, Linux)
- Set up release automation
- Add app icons and branding

### 17. **Additional Plot Types**
- Implement "byactivitytype" plot (mentioned but not implemented)
- Add trip segmentation visualization
- Add timeline chart showing activity distribution
- Create summary statistics dashboard

---

*Last Updated: 2026-02-17*
*Repository: ronzim/mappit-core*
