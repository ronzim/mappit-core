/**
 * Typed IPC channel definitions shared between main, preload and renderer.
 *
 * By declaring every channel and its payload types in one place we get
 * compile-time safety across process boundaries.
 */

import type {
    MappitDataset,
    DatasetSummary,
    PeriodSummary,
    BoundingBox,
} from 'mappit-core';

// ---------------------------------------------------------------------------
// Main → Renderer (one-way events via webContents.send)
// ---------------------------------------------------------------------------

/** Events the main process can push to the renderer. */
export interface MainToRendererEvents {
    /** Notify the renderer that a dataset has been loaded. */
    'dataset:loaded': MappitDataset;
    /** Notify of an error during a main-process operation. */
    'app:error': string;
}

// ---------------------------------------------------------------------------
// Renderer → Main (invoke/handle request-response)
// ---------------------------------------------------------------------------

/** Arguments for each IPC invoke channel. */
export interface InvokeArgs {
    'dialog:openFile': void;
    'dataset:load': { filePath: string; format?: string };
    'dataset:filter': {
        dateRange?: { start: string; end: string };
        area?: BoundingBox;
        activityTypes?: string[];
    };
    'dataset:stats': void;
    'dataset:yearlyStats': void;
    'dataset:export': { filePath: string };
}

/** Return types for each IPC invoke channel. */
export interface InvokeResult {
    'dialog:openFile': string | null;
    'dataset:load': MappitDataset;
    'dataset:filter': MappitDataset;
    'dataset:stats': DatasetSummary | null;
    'dataset:yearlyStats': PeriodSummary[];
    'dataset:export': boolean;
}

/** All channel names. */
export type IpcChannel = keyof InvokeArgs;
