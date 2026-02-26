/**
 * Global type augmentation so the renderer can use `window.api` with
 * full type-safety without importing anything from the preload script.
 */

import type { MappitApi } from '../preload/index';

declare global {
    interface Window {
        api: MappitApi;
    }
}
