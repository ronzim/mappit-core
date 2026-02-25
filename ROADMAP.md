# MappIt Core — Roadmap di ristrutturazione

## Obiettivo finale

Ottenere **due deliverable** dal repository:

1. **`mappit-core`** — Una libreria JavaScript/TypeScript pura (senza dipendenze UI) che:
   - Carica, normalizza e filtra dati di geolocalizzazione Google
   - Supporta **tutti i formati** esistenti: Records.json (legacy), Timeline.json (Standard, Semantic, iOS), file mensili Takeout (YYYY_MONTH.json)
   - È utilizzabile sia come **modulo programmatico** (`import { loadData, filterByDate } from 'mappit-core'`) sia da **riga di comando** (`npx mappit-core --load ./data --filter-date 2024-01-01 2024-06-30 --export output.json`)
   - Espone un modello dati unificato, indipendente dal formato sorgente

2. **`mappit-app`** — Un'app Electron che:
   - Importa `mappit-core` come dipendenza
   - Implementa l'interfaccia di visualizzazione attualmente presente in `timeline.html` (deck.gl + Mapbox, timeline sidebar, filtri, ricerca, summary, export KML)
   - Supporta tutti i formati tramite la libreria core
   - Sostituisce sia la vecchia app Electron+Plotly sia il viewer HTML standalone

---

## Stato attuale del codice

| Componente          | File                                                                      | Cosa fa                                                        | Problemi                                                                                       |
| ------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| App Electron legacy | `src/main.js`, `src/data.js`, `src/plot.js`, `src/utils.js`, `index.html` | Carica Records.json, filtra per data, plotta con Plotly/Mapbox | Electron 9, `nodeIntegration: true`, solo formato Records.json, nessun test                    |
| Timeline Viewer     | `timeline.html`                                                           | Viewer completo del nuovo formato Takeout con Google Maps      | File monolitico ~6000 righe, non modulare, API key hardcoded, nessuna integrazione con il core |
| CLI/test            | `test_data.js`                                                            | Script di test manuale                                         | Non è un vero test framework                                                                   |

### Formati dati supportati (nel viewer, non nel core attuale)

| Formato                    | Sorgente                          | Struttura                                                                          |
| -------------------------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| **Records.json** (legacy)  | Google Takeout pre-2024           | `{ locations: [{ timestamp, latitudeE7, longitudeE7, velocity, activity, ... }] }` |
| **Timeline.json Standard** | Google Takeout                    | `{ timelineObjects: [{ placeVisit \| activitySegment }] }`                         |
| **Timeline.json Semantic** | Google Takeout nuovo              | `{ semanticSegments: [{ visit \| activity, startTime, endTime, timelinePath }] }`  |
| **Timeline.json iOS**      | Google Maps iOS export            | `Array<{ startTime, endTime, visit \| activity, timelinePath }>`                   |
| **YYYY_MONTH.json**        | Google Takeout (cartelle mensili) | Come Standard, un file per mese                                                    |

---

## Modello dati unificato (target)

Il core deve normalizzare tutti i formati in un unico modello interno:

```typescript
// Un singolo record di posizione (per Records.json / scatter plot)
interface LocationPoint {
  timestamp: string; // ISO 8601
  lat: number; // gradi decimali
  lng: number; // gradi decimali
  accuracy?: number;
  velocity?: number; // m/s
  heading?: number;
  altitude?: number;
  source?: string;
  activityType?: string; // tipo di attività normalizzato (gruppo)
  activityConfidence?: number;
}

// Una visita a un luogo
interface PlaceVisit {
  type: 'visit';
  startTime: string;
  endTime: string;
  lat: number;
  lng: number;
  placeId?: string;
  name?: string;
  semanticType?: string;
  editConfirmationStatus?: string;
}

// Un segmento di attività (spostamento)
interface ActivitySegment {
  type: 'activity';
  startTime: string;
  endTime: string;
  activityType: string; // normalizzato tramite activityGroupMapping
  distanceMeters?: number;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  path: Array<{ lat: number; lng: number; timestamp?: string }>;
}

// Elemento della timeline (unione delle due tipologie)
type TimelineEntry = PlaceVisit | ActivitySegment;

// Dataset completo caricato
interface MappitDataset {
  source:
    | 'records'
    | 'timeline-standard'
    | 'timeline-semantic'
    | 'timeline-ios'
    | 'takeout-monthly';
  dateRange: { min: string; max: string };
  // Per Records.json: array di punti grezzi
  points: LocationPoint[];
  // Per tutti i formati Timeline: eventi strutturati
  timeline: TimelineEntry[];
}
```

---

## Fasi di sviluppo

### Fase 0 — Setup del progetto

> **Obiettivo**: struttura monorepo, tooling moderno, nessuna funzionalità nuova.

- [x] **0.1** Inizializzare un monorepo con workspace npm
  ```
  mappit-core/
  ├── packages/
  │   ├── core/          ← libreria
  │   │   ├── src/
  │   │   ├── package.json
  │   │   └── tsconfig.json
  │   └── app/           ← app Electron
  │       ├── src/
  │       ├── package.json
  │       └── tsconfig.json
  ├── package.json       ← workspace root
  └── tsconfig.base.json
  ```
- [x] **0.2** Configurare TypeScript per entrambi i package (target ES2020+, strict mode)
- [x] **0.3** Configurare ESLint + Prettier condivisi
- [x] **0.4** Configurare Vitest come test runner per il core
- [x] **0.5** Aggiungere script di build (`tsc`) per il core → output CommonJS
- [x] **0.6** Creare cartella `fixtures/` con dati di test per tutti i formati (records, standard, semantic, iOS, monthly)

**Deliverable**: repo compilabile, nessuna funzionalità ancora migrata.

---

### Fase 1 — Libreria core: loader e normalizzazione

> **Obiettivo**: il core sa caricare e normalizzare tutti e 5 i formati in `MappitDataset`.

- [x] **1.1** Portare `src/utils.js` → `packages/core/src/geo.ts` (haversine, degToRad, mean, normalize)
- [x] **1.2** Portare `src/defaults.js` → `packages/core/src/constants.ts` (colorscale, activity mapping)
- [x] **1.3** Creare `packages/core/src/types.ts` con le interfacce del modello dati unificato
- [x] **1.4** Creare `packages/core/src/activity-mapping.ts` — estrarre `activityGroupMapping` e `getGroupedActivityType` da `timeline.html`
- [x] **1.5** Creare `packages/core/src/loaders/records.ts`
  - Carica Records.json (streaming con big-json per file grandi, JSON.parse per file piccoli)
  - Normalizza ogni location in `LocationPoint`
  - Produce un `MappitDataset` con `source: 'records'` e il campo `points` popolato
- [x] **1.6** Creare `packages/core/src/loaders/timeline-standard.ts`
  - Carica `{ timelineObjects: [...] }`
  - Normalizza `placeVisit` → `PlaceVisit`, `activitySegment` → `ActivitySegment`
  - Popola `timeline` nel `MappitDataset`
- [x] **1.7** Creare `packages/core/src/loaders/timeline-semantic.ts`
  - Gestisce `{ semanticSegments: [...] }`
  - Parsifica le coordinate `"45.123°, 9.456°"` e la `timelinePath`
  - Associa i punti del path ai segmenti di attività (logica del pointer ottimizzato già presente in timeline.html)
- [x] **1.8** Creare `packages/core/src/loaders/timeline-ios.ts`
  - Gestisce il formato array iOS
  - Preprocessa `timelinePath` con offset in minuti
  - Trasforma `visit`/`activity` nel modello unificato
- [x] **1.9** Creare `packages/core/src/loaders/takeout-monthly.ts`
  - Scansiona una directory per file `YYYY_MONTH.json`
  - Riutilizza il loader Standard per ciascun file
  - Concatena i risultati
- [x] **1.10** Creare `packages/core/src/loaders/auto-detect.ts`
  - Dato un file o directory, rileva automaticamente il formato
  - Se è un singolo JSON: ispeziona la struttura (array? `timelineObjects`? `semanticSegments`? `locations`?)
  - Se è una directory: cerca `Timeline.json` al top level, altrimenti scansiona per file mensili
  - Restituisce il `MappitDataset` appropriato
- [x] **1.11** Scrivere test unitari per ogni loader con fixture dei rispettivi formati
- [x] **1.12** Aggiornare `packages/core/src/index.ts` — export pubblico della libreria

**Deliverable**: `import { loadDataset } from 'mappit-core'` funziona con tutti i formati.

---

### Fase 2 — Libreria core: filtri, trasformazioni, export

> **Obiettivo**: il core offre operazioni di filtro, statistiche e export.

- [x] **2.1** `packages/core/src/filters.ts`
  - `filterByDateRange(dataset, start, end)` — filtra sia `points` che `timeline`
  - `filterByArea(dataset, bounds)` — bounding box geografico (il `--filterspace` attualmente TODO)
  - `filterByActivityType(dataset, types[])` — filtra per tipo di attività
- [x] **2.2** `packages/core/src/transforms.ts`
  - `simplifyDataset(dataset)` — versione evoluta di `simplifyData` attuale
  - `timelineToPoints(dataset)` — esplode i segmenti della timeline in punti individuali (per scatter/heatmap)
  - _(fase futura)_ `recordsToTimeline(dataset)` — clustering temporale/spaziale per convertire punti GPS grezzi in pseudo-visite e pseudo-segmenti
- [x] **2.3** `packages/core/src/stats.ts`
  - `computeSummary(dataset)` — calcola statistiche: distanza totale, numero visite, distribuzione attività, date min/max
  - `computeYearlySummary(dataset)` / `computeMonthlySummary(dataset)` — estrarre la logica da `calculateSummaries()` in timeline.html
- [x] **2.4** `packages/core/src/exporters/json-exporter.ts` — esporta dataset filtrato in JSON semplificato
- [x] **2.5** `packages/core/src/exporters/kml-exporter.ts` — estrarre la logica di `exportToKML()` da timeline.html
- [x] **2.6** Test unitari per filtri, trasformazioni e exporter
- [x] **2.7** Aggiornare `packages/core/src/index.ts` con tutti gli export

**Deliverable**: la libreria è completa come modulo programmatico.

---

### Fase 3 — CLI

> **Obiettivo**: la libreria è utilizzabile da terminale.

- [ ] **3.1** Creare `packages/core/src/cli.ts` con yargs/commander
  ```
  mappit-core load <path>                 # auto-detect formato
  mappit-core load <path> --format records
  mappit-core load <path> --filter-date 2024-01-01 2024-06-30
  mappit-core load <path> --filter-area 45.0,9.0,46.0,10.0
  mappit-core load <path> --filter-activity WALKING,CYCLING
  mappit-core load <path> --export output.json
  mappit-core load <path> --export output.kml
  mappit-core load <path> --stats
  ```
- [ ] **3.2** Aggiungere campo `bin` in `packages/core/package.json`
- [ ] **3.3** Aggiungere progress bar (cli-progress o ora) per operazioni lunghe
- [ ] **3.4** Test e2e per la CLI
- [ ] **3.5** Documentare la migrazione dai comandi legacy (`--loadfile`, `--filterdate`, `--plot`, `--writeOutput`) alla nuova CLI nel README

**Deliverable**: `npx mappit-core load ./Takeout --stats` funziona.

---

### Fase 4 — App Electron: scaffold e integrazione core

> **Obiettivo**: nuova app Electron con architettura sicura che usa il core.

- [ ] **4.1** Configurare Electron recente (v33+) in `packages/app/`
  - `contextIsolation: true`, `nodeIntegration: false`
  - Preload script con `contextBridge`
  - IPC channels tipizzati per comunicazione main↔renderer
- [ ] **4.2** Scegliere un framework per il renderer:
  - **Vanilla JS + bundler** (più vicino all'attuale timeline.html, migrazione più semplice)
- [ ] **4.3** Configurare Vite come bundler per il renderer process
- [ ] **4.4** Main process: usare `mappit-core` per tutte le operazioni dati
  - `ipc.handle('load-dataset', (path) => loadDataset(path))`
  - `ipc.handle('filter', (dataset, filters) => filterByDateRange(...))`
  - `ipc.handle('export-kml', (dataset, range) => exportToKML(...))`
  - `ipc.handle('compute-stats', (dataset) => computeSummary(...))`
- [ ] **4.5** Renderer process: gestione stato dei dati caricati
  - Riceve `MappitDataset` serializzato dal main process via IPC
  - Mantiene stato locale per filtri attivi, date selezionate, vista corrente
- [ ] **4.6** Implementare caricamento dati
  - Seleziona cartella/file tramite dialog nativo di Electron (sostituisce File System Access API del browser)
  - Il main process usa `mappit-core` per caricare e inviare i dati al renderer
  - Supporto sia per directory Takeout che per singoli file

**Deliverable**: app che carica dati da qualsiasi formato e li mostra in console/log.

---

### Fase 5 — App Electron: UI mappa e timeline

> **Obiettivo**: replicare la UI di timeline.html nell'app Electron.

- [ ] **5.1** Integrare deck.gl API nel renderer
  - Gestire eventuale API key via variabile d'ambiente / file di configurazione (non hardcoded)
  - markers, linee, InfoWindow
- [ ] **5.2** Sidebar con timeline
  - Date picker (range)
  - Lista cronologica di visite e attività
  - Icone per tipo attività
  - Click per evidenziare su mappa e viceversa
- [ ] **5.3** Filtri attività (checkbox per tipo, mostra/nascondi visite e spostamenti)
- [ ] **5.4** Rendering mappa
  - Marker per le visite (`renderPlaceVisit`)
  - Polilinee per gli spostamenti (`renderActivitySegment`)
  - Auto-zoom/fit bounds
  - Highlight polyline al click
- [ ] **5.5** Interazione mappa↔sidebar
  - Click marker → evidenzia sidebar item e viceversa
  - Scroll automatico alla sidebar item corrispondente
- [ ] **5.6** Place Details (opzionale/progressivo)
  - Fetch via Google Places API per arricchire i marker (disponibile dopo migrazione a Google Maps)
  - Cache su filesystem: file JSON in `app.getPath('userData')`, lettura/scrittura gestita dal main process via IPC
  - Toggle per disabilitare chiamate API

**Deliverable**: l'app è comparabile a timeline.html per la vista mappa+timeline.

---

### Fase 6 — App Electron: funzionalità avanzate

> **Obiettivo**: parità completa con timeline.html + miglioramenti.

- [ ] **6.1** Summary view con statistiche annuali/mensili
  - Grafici con Chart.js (distanze, visite per categoria)
  - Navigazione year → month → day
- [ ] **6.2** Ricerca luoghi
  - Ricerca offline nel dataset caricato per nome/placeId
  - Navigazione ai risultati sulla mappa
  - _(fase futura, dopo migrazione Google Maps)_ Autocomplete tramite Places API; alternativa: Nominatim/OpenStreetMap
- [ ] **6.3** Area search (trova visite nell'area visibile della mappa)
  - Usa `filterByArea` del core
  - Mostra risultati consolidati o singoli
- [ ] **6.4** Export KML (usa `mappit-core` KML exporter)
- [ ] **6.5** Impostazioni: timezone, unità di distanza, Home/Work Place IDs
- [ ] **6.6** Layout responsive / mobile-friendly
- [ ] **6.7** Supporto modalità scatter/heatmap per dati Records.json
  - Usa `timelineToPoints` e visualizza come `ScatterplotLayer` o `HeatmapLayer` di deck.gl
  - Sostituisce la visualizzazione Plotly/Mapbox della vecchia app Electron

**Deliverable**: l'app Electron sostituisce completamente sia il vecchio Electron+Plotly sia timeline.html.

---

### Fase 7 — Pulizia e rilascio

> **Obiettivo**: codice production-ready.

- [ ] **7.1** Rimuovere i file legacy (`src/main.js`, `src/data.js`, `src/plot.js`, `src/utils.js`, `src/defaults.js`, `index.html`, `test_data.js`, `timeline.html`)
- [ ] **7.2** Documentazione API per `mappit-core` (JSDoc o TypeDoc)
- [ ] **7.3** README aggiornato con istruzioni per entrambi i package
- [ ] **7.4** CI/CD: GitHub Actions per lint, test, build
- [ ] **7.5** Pubblicazione npm del core (opzionale, può restare privato)
- [ ] **7.6** Build dell'app Electron per distribuzione con electron-builder

---

## Diagramma delle dipendenze

```
┌─────────────────────────────────────────────────┐
│                   mappit-app                     │
│          (Electron + deck.gl + Mapbox)            │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Main     │  │ Renderer │  │  Preload      │  │
│  │ Process   │──│ Process  │──│ (contextBridge│  │
│  │           │  │ (UI/Map) │  │   + IPC)      │  │
│  └─────┬─────┘  └──────────┘  └───────────────┘  │
│        │                                          │
│        │ import                                   │
│        ▼                                          │
│  ┌─────────────────────────┐                      │
│  │      mappit-core        │ ◄── anche utilizzabile│
│  │                         │     standalone via CLI│
│  │  • Loaders (5 formati)  │     o come libreria  │
│  │  • Filtri               │                      │
│  │  • Trasformazioni       │                      │
│  │  • Statistiche          │                      │
│  │  • Exporters            │                      │
│  │  • CLI                  │                      │
│  └─────────────────────────┘                      │
└─────────────────────────────────────────────────┘
```

---

## Stima dei tempi (ordine di grandezza)

| Fase                      | Effort stimato    | Note                                             |
| ------------------------- | ----------------- | ------------------------------------------------ |
| 0 — Setup                 | 1-2 giorni        | Boilerplate, configurazione                      |
| 1 — Loaders               | 3-5 giorni        | Parte più critica: 5 formati, test               |
| 2 — Filtri/Export         | 2-3 giorni        | Logica relativamente semplice                    |
| 3 — CLI                   | 1-2 giorni        | Wrapping della libreria                          |
| 4 — Electron scaffold     | 2-3 giorni        | Architettura, IPC, build                         |
| 5 — UI mappa+timeline     | 5-7 giorni        | Migrazione da timeline.html, la parte più grossa |
| 6 — Funzionalità avanzate | 3-5 giorni        | Summary, search, area, export                    |
| 7 — Pulizia               | 1-2 giorni        | Docs, CI, cleanup                                |
| **Totale**                | **~18-29 giorni** | Lavoro individuale, full-time                    |

---

## Decisioni:

1. **TypeScript**: TypeScript consigliato per il core (type safety sui modelli dati). L'app può partire in JS e poi migrare.
2. **Framework UI per il renderer**: Vanilla (più facile da migrare da timeline.html). Vanilla + Vite per la fase iniziale. In futuro Vue.js.
3. **Mappa**: deck.gl + Mapbox per la fase iniziale (nessuna API key obbligatoria). Migrazione a Google Maps in una fase successiva per aggiungere Place Details e autocomplete Places API.
4. **Monorepo tool**: npm workspaces (zero config)
5. **Streaming per file grandi**: migrare a `stream-json` (più mantenuto, già nelle dipendenze).
6. **Nome dei package**: `mappit-core` + `mappit-app` (senza scope npm org).
7. **Cache Place Details**: file JSON su filesystem nella app data directory (`app.getPath('userData')`), gestita dal main process.
8. **Distribuzione**: electron-builder.
9. **`recordsToTimeline`**: demandata a una fase futura; non bloccante per le prime release.
