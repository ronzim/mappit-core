# MappIt

Strumenti per caricare, filtrare e visualizzare i dati di Google Location History scaricati da Google Takeout.

Il repository è un **monorepo npm workspaces** composto da due package:

| Package       | Percorso         | Descrizione                                                                                           |
| ------------- | ---------------- | ----------------------------------------------------------------------------------------------------- |
| `mappit-core` | `packages/core/` | Libreria Node.js + CLI. Carica, normalizza e filtra dati di localizzazione da tutti i formati Google. |
| `mappit-app`  | `packages/app/`  | App Electron per la visualizzazione (in sviluppo — vedi [ROADMAP.md](ROADMAP.md)).                    |

---

## Prerequisiti

- Node.js ≥ 18
- npm ≥ 10

---

## Installazione

```bash
# Clona il repo e installa tutte le dipendenze di entrambi i package
npm install
```

---

## `mappit-core` — Libreria e CLI

### Sviluppo

```bash
# Compila in watch mode (rigenera dist/ ad ogni modifica)
npm run dev --workspace=packages/core

# Oppure dalla cartella del package
cd packages/core
npm run dev
```

La build produce output CommonJS in `packages/core/dist/`.

```bash
# Esegui i test in watch mode
npm run test:watch --workspace=packages/core

# Esegui i test una volta sola
npm run test --workspace=packages/core

# Controlla solo i tipi senza emettere file
npm run typecheck --workspace=packages/core
```

### Build di produzione

```bash
npm run build --workspace=packages/core
# oppure da root, per tutti i package in una volta:
npm run build
```

L'output viene emesso in `packages/core/dist/`:

```
dist/
├── index.js      ← entry point della libreria
├── index.d.ts    ← dichiarazioni TypeScript
├── cli.js        ← entry point della CLI
└── ...           ← sorgenti compilati dei moduli interni
```

### Uso come libreria

```js
// CommonJS
const { loadDataset, filterByDateRange } = require('mappit-core');

// TypeScript / ESM (dopo build)
import { loadDataset, filterByDateRange } from 'mappit-core';

const dataset = await loadDataset('./Takeout/Location History');
const filtered = filterByDateRange(dataset, '2024-01-01', '2024-06-30');
```

> **Nota**: l'implementazione completa dei loader e dei filtri è pianificata nella Fase 1–2. Vedi [ROADMAP.md](ROADMAP.md).

### Uso da CLI

Dopo la build, il comando `mappit-core` è disponibile tramite `npx`:

```bash
# Auto-detect del formato (Records.json, Timeline.json, cartella Takeout)
npx mappit-core load ./path/to/data

# Filtra per data
npx mappit-core load ./data --filter-date 2024-01-01 2024-06-30

# Filtra per area geografica (bounding box: lat_min,lng_min,lat_max,lng_max)
npx mappit-core load ./data --filter-area 45.0,9.0,46.0,10.0

# Filtra per tipo di attività
npx mappit-core load ./data --filter-activity WALKING,CYCLING

# Mostra statistiche
npx mappit-core load ./data --stats

# Esportazione
npx mappit-core load ./data --filter-date 2024-01-01 2024-06-30 --export output.json
npx mappit-core load ./data --filter-date 2024-01-01 2024-06-30 --export output.kml
```

Tutte le opzioni:

```
mappit-core load <path>

Positionals:
  path  Percorso a un file JSON o directory Takeout         [string] [required]

Options:
  -f, --format           Forza un formato specifico (auto-detect di default)
         [string] [choices: records, timeline-standard, timeline-semantic,
                                                                 timeline-ios]
  -d, --filter-date      Filtra per intervallo date (due date ISO)       [array]
  -a, --filter-area      Filtra per bounding box: south,west,north,east [string]
      --filter-activity   Filtra per tipo di attività (separati da virgola)
                                                                        [string]
  -e, --export           Esporta su file (.json o .kml)                 [string]
  -s, --stats            Mostra statistiche di riepilogo
                                                      [boolean] [default: false]
```

### Migrazione dalla CLI legacy

Se usavi la vecchia CLI basata su Electron (`src/main.js`), ecco la mappatura dei comandi:

| Vecchio comando                          | Nuovo comando                             |
| ---------------------------------------- | ----------------------------------------- |
| `--loadfile ./Records.json`              | `load ./Records.json`                     |
| `--filterdate '2022-08-06' '2022-08-17'` | `--filter-date 2022-08-06 2022-08-17`     |
| `--filterspace` (non implementato)       | `--filter-area south,west,north,east`     |
| `--writeOutput`                          | `--export output.json`                    |
| `--plot heatmap --render`                | (visualizzazione → `mappit-app`, Fase 4+) |

> La vecchia CLI richiedeva Electron per funzionare. La nuova CLI è un programma Node.js puro e non ha dipendenze grafiche.

### Formati dati supportati

| Formato                                       | Rilevamento automatico                                |
| --------------------------------------------- | ----------------------------------------------------- |
| `Records.json` (legacy, pre-2024)             | presenza di `{ locations: [...] }`                    |
| `Timeline.json` Standard                      | presenza di `{ timelineObjects: [...] }`              |
| `Timeline.json` Semantic                      | presenza di `{ semanticSegments: [...] }`             |
| `Timeline.json` iOS                           | struttura ad array `[{ startTime, visit\|activity }]` |
| File mensili Takeout (`2024_JANUARY.json`, …) | directory con file `YYYY_MONTH.json`                  |

---

## `mappit-app` — App Electron

> **Stato attuale**: placeholder — l'implementazione è pianificata dalla Fase 4 in poi. Vedi [ROADMAP.md](ROADMAP.md).

### Sviluppo (futuro)

```bash
cd packages/app
npm run dev
```

### Build di produzione (futuro)

```bash
cd packages/app
npm run build

# Pacchettizzazione con electron-builder
npm run dist
```

---

## Script dal root del monorepo

```bash
npm run build        # build di tutti i package
npm run test         # test di tutti i package
npm run lint         # ESLint su tutti i sorgenti TypeScript
npm run format       # Prettier su tutti i sorgenti TypeScript
npm run legacy:start # avvia la vecchia app Electron+Plotly (pre-ristrutturazione)
```

---

## Fixtures di test

La cartella `fixtures/` contiene file di esempio per ogni formato, usati dai test unitari:

```
fixtures/
├── records.json            ← Records.json (formato legacy)
├── timeline-standard.json  ← Timeline.json con timelineObjects
├── timeline-semantic.json  ← Timeline.json con semanticSegments
├── timeline-ios.json       ← Timeline.json formato iOS (array)
└── 2024_JANUARY.json       ← file mensile Takeout
```

---

## Struttura del repo

```
mappit-core/
├── packages/
│   ├── core/               ← mappit-core (libreria + CLI)
│   │   ├── src/
│   │   ├── dist/           ← output build (gitignored)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   └── app/                ← mappit-app (Electron)
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── fixtures/               ← dati di test per tutti i formati
├── src/                    ← codice legacy (pre-ristrutturazione)
├── timeline.html           ← viewer HTML standalone (pre-ristrutturazione)
├── tsconfig.base.json      ← tsconfig condiviso
├── eslint.config.js
├── .prettierrc
├── package.json            ← workspace root
└── ROADMAP.md              ← piano di sviluppo dettagliato
```

---

## Formati dati Google — Riferimento

Per la specifica completa dei formati di esportazione di Google Location History, vedi [locationhistoryformat.com](https://locationhistoryformat.com/).

Riepilogo dei campi principali:

- **`latitudeE7` / `longitudeE7`**: coordinate in formato E7 (gradi × 10⁷, intero)
- **`timestamp`**: ISO 8601 UTC
- **`velocity`**: m/s
- **`accuracy`**: raggio in metri
- **`placeVisit`**: visita a un luogo con `placeId`, `duration`, `location`
- **`activitySegment`**: spostamento con `activityType`, `duration`, `simplifiedRawPath`

---

## Roadmap

Vedi [ROADMAP.md](ROADMAP.md) per il piano dettagliato suddiviso in fasi.
