/**
 * mappit-app — Electron main process.
 *
 * Responsibilities:
 * - Create the BrowserWindow (contextIsolation, sandbox)
 * - Register IPC handlers that proxy all data operations via mappit-core
 * - Keep the "current dataset" in memory (mutable state lives here)
 */

import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs';

import {
    parseAuto,
    parseRecords,
    parseTimelineStandard,
    parseTimelineSemantic,
    parseTimelineIos,
    parseTakeoutMonthly,
    filterByDateRange,
    filterByArea,
    filterByActivityType,
    computeSummary,
    computeYearlySummary,
    exportToJson,
    exportToKml,
} from 'mappit-core';
import type { MappitDataset, DataSource, BoundingBox } from 'mappit-core';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let mainWindow: BrowserWindow | null = null;
let currentDataset: MappitDataset | null = null;

// ---------------------------------------------------------------------------
// File / directory loading helpers
// ---------------------------------------------------------------------------

/**
 * Recursively find files matching a pattern inside a directory tree.
 * Skips hidden files and NTFS Zone.Identifier alternates.
 */
function findFilesRecursive(dir: string, pattern: RegExp): string[] {
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.includes(':') || entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findFilesRecursive(full, pattern));
        } else if (pattern.test(entry.name)) {
            results.push(full);
        }
    }
    return results;
}

/** Load a dataset from a directory (Takeout export tree). */
function loadFromDirectory(dirPath: string): MappitDataset {
    const resolved = path.resolve(dirPath);

    // 1 — Monthly files (e.g. 2024_JANUARY.json) anywhere in the tree
    const monthlyFiles = findFilesRecursive(resolved, /^\d{4}_[A-Z]+\.json$/i);
    if (monthlyFiles.length > 0) {
        const fileMap = new Map<string, unknown>();
        for (const f of monthlyFiles) {
            const key = path.basename(f, '.json');
            const raw = fs.readFileSync(f, 'utf-8');
            fileMap.set(key, JSON.parse(raw) as unknown);
        }
        return parseTakeoutMonthly(fileMap);
    }

    // 2 — Single Records.json or Timeline.json anywhere in the tree
    for (const name of ['Records.json', 'Timeline.json']) {
        const found = findFilesRecursive(resolved, new RegExp(`^${name}$`, 'i'));
        if (found.length > 0) {
            const raw = fs.readFileSync(found[0], 'utf-8');
            return parseAuto(JSON.parse(raw) as unknown);
        }
    }

    throw new Error(`No supported files found in ${resolved}`);
}

/** Load a dataset from a single JSON file with optional format override. */
function loadFromFile(filePath: string, format?: string): MappitDataset {
    const resolved = path.resolve(filePath);
    const raw = fs.readFileSync(resolved, 'utf-8');
    const data: unknown = JSON.parse(raw);

    if (format) {
        switch (format as DataSource) {
            case 'records':
                return parseRecords(data);
            case 'timeline-standard':
                return parseTimelineStandard(data);
            case 'timeline-semantic':
                return parseTimelineSemantic(data);
            case 'timeline-ios':
                return parseTimelineIos(data);
            default:
                throw new Error(`Unknown format: ${format}`);
        }
    }

    return parseAuto(data);
}

/** Load from a path that can be either a file or a directory. */
function loadFromPath(filePath: string, format?: string): MappitDataset {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
        return loadFromDirectory(filePath);
    }
    return loadFromFile(filePath, format);
}

// ---------------------------------------------------------------------------
// Window creation
// ---------------------------------------------------------------------------

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'MappIt',
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false, // required for preload to use Node.js APIs
        },
    });

    // In dev mode, load the Vite dev server URL; in production, load the built HTML.
    const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
    if (process.env.NODE_ENV === 'development' && rendererUrl) {
        mainWindow.loadURL(rendererUrl);
    } else {
        mainWindow.loadFile(
            path.join(__dirname, '../renderer/index.html'),
        );
    }

    // Open external links in the default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------

function registerIpcHandlers(): void {
    // --- dialog:openFile ---------------------------------------------------
    ipcMain.handle('dialog:openFile', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile', 'openDirectory'],
            filters: [
                { name: 'JSON files', extensions: ['json'] },
                { name: 'All files', extensions: ['*'] },
            ],
        });
        if (result.canceled || result.filePaths.length === 0) return null;
        return result.filePaths[0];
    });

    // --- dataset:load ------------------------------------------------------
    ipcMain.handle(
        'dataset:load',
        (_event, args: { filePath: string; format?: string }) => {
            const ds = loadFromPath(args.filePath, args.format);
            currentDataset = ds;
            // Also push to renderer as an event
            mainWindow?.webContents.send('dataset:loaded', ds);
            return ds;
        },
    );

    // --- dataset:filter ----------------------------------------------------
    ipcMain.handle(
        'dataset:filter',
        (
            _event,
            args: {
                dateRange?: { start: string; end: string };
                area?: BoundingBox;
                activityTypes?: string[];
            },
        ) => {
            if (!currentDataset) {
                throw new Error('No dataset loaded');
            }

            let ds = currentDataset;

            if (args.dateRange) {
                ds = filterByDateRange(ds, args.dateRange.start, args.dateRange.end);
            }
            if (args.area) {
                ds = filterByArea(ds, args.area);
            }
            if (args.activityTypes && args.activityTypes.length > 0) {
                ds = filterByActivityType(ds, args.activityTypes);
            }

            // Update current dataset to the filtered version
            currentDataset = ds;
            mainWindow?.webContents.send('dataset:loaded', ds);
            return ds;
        },
    );

    // --- dataset:stats -----------------------------------------------------
    ipcMain.handle('dataset:stats', () => {
        if (!currentDataset) return null;
        return computeSummary(currentDataset);
    });

    // --- dataset:yearlyStats -----------------------------------------------
    ipcMain.handle('dataset:yearlyStats', () => {
        if (!currentDataset) return [];
        return computeYearlySummary(currentDataset);
    });

    // --- dataset:export ----------------------------------------------------
    ipcMain.handle(
        'dataset:export',
        (_event, args: { filePath: string }) => {
            if (!currentDataset) {
                throw new Error('No dataset loaded');
            }

            const ext = path.extname(args.filePath).toLowerCase();
            const content =
                ext === '.kml'
                    ? exportToKml(currentDataset)
                    : exportToJson(currentDataset);

            fs.writeFileSync(args.filePath, content, 'utf-8');
            return true;
        },
    );
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();

    app.on('activate', () => {
        // macOS: re-create window when dock icon is clicked
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
