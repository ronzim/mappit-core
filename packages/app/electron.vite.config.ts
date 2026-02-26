import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
        build: {
            outDir: 'dist/main',
            rollupOptions: {
                input: resolve(__dirname, 'src/main/index.ts'),
            },
        },
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        build: {
            outDir: 'dist/preload',
            rollupOptions: {
                input: resolve(__dirname, 'src/preload/index.ts'),
            },
        },
    },
    renderer: {
        root: resolve(__dirname, 'src/renderer'),
        resolve: {
            alias: {
                // deck.gl's @deck.gl/mapbox imports 'mapbox-gl' internally;
                // redirect to maplibre-gl (free, no token required).
                'mapbox-gl': 'maplibre-gl',
            },
        },
        build: {
            outDir: resolve(__dirname, 'dist/renderer'),
            rollupOptions: {
                input: resolve(__dirname, 'src/renderer/index.html'),
            },
        },
    },
});
