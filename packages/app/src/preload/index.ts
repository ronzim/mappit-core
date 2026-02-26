/**
 * Preload script — runs in a sandboxed context before the renderer.
 *
 * Exposes a strictly-typed `window.api` object via contextBridge so the
 * renderer can call main-process operations without accessing Node.js
 * directly.
 */

import { contextBridge, ipcRenderer } from 'electron';
import type {
    InvokeArgs,
    InvokeResult,
    MainToRendererEvents,
} from '../shared/ipc-channels';

// ---------------------------------------------------------------------------
// Typed invoke helper
// ---------------------------------------------------------------------------

function invoke<C extends keyof InvokeArgs>(
    channel: C,
    ...args: InvokeArgs[C] extends void ? [] : [InvokeArgs[C]]
): Promise<InvokeResult[C]> {
    return ipcRenderer.invoke(channel, ...args) as Promise<InvokeResult[C]>;
}

// ---------------------------------------------------------------------------
// API exposed to the renderer via window.api
// ---------------------------------------------------------------------------

export const api = {
    /** Open a native file/directory picker and return the selected path. */
    openFile: () => invoke('dialog:openFile'),

    /** Load a dataset from a file or directory path. */
    loadDataset: (filePath: string, format?: string) =>
        invoke('dataset:load', { filePath, format }),

    /** Apply filters to the currently loaded dataset. */
    filterDataset: (filters: InvokeArgs['dataset:filter']) =>
        invoke('dataset:filter', filters),

    /** Get summary statistics for the current dataset. */
    getStats: () => invoke('dataset:stats'),

    /** Get yearly breakdown statistics. */
    getYearlyStats: () => invoke('dataset:yearlyStats'),

    /** Export the current dataset to a file. */
    exportDataset: (filePath: string) =>
        invoke('dataset:export', { filePath }),

    // -----------------------------------------------------------------------
    // Main → Renderer event listeners
    // -----------------------------------------------------------------------

    /** Subscribe to dataset-loaded events from the main process. */
    onDatasetLoaded: (
        callback: (dataset: MainToRendererEvents['dataset:loaded']) => void,
    ) => {
        const handler = (
            _event: Electron.IpcRendererEvent,
            data: MainToRendererEvents['dataset:loaded'],
        ) => callback(data);
        ipcRenderer.on('dataset:loaded', handler);
        return () => ipcRenderer.removeListener('dataset:loaded', handler);
    },

    /** Subscribe to error events from the main process. */
    onError: (
        callback: (message: MainToRendererEvents['app:error']) => void,
    ) => {
        const handler = (
            _event: Electron.IpcRendererEvent,
            msg: MainToRendererEvents['app:error'],
        ) => callback(msg);
        ipcRenderer.on('app:error', handler);
        return () => ipcRenderer.removeListener('app:error', handler);
    },
} as const;

/** Type of the API exposed to the renderer. */
export type MappitApi = typeof api;

// ---------------------------------------------------------------------------
// Expose
// ---------------------------------------------------------------------------

contextBridge.exposeInMainWorld('api', api);
