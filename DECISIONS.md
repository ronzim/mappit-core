# MappIt Core — Decisioni implementative

Registro delle scelte tecniche adottate durante la ristrutturazione del progetto. Ogni voce indica la decisione, la motivazione e la fase in cui è stata presa.

---

## Architettura

### Monorepo con npm workspaces (Fase 0)

**Scelta**: struttura monorepo con `packages/core` e `packages/app`, gestita tramite npm workspaces nativi.

**Motivazione**: zero dipendenze aggiuntive (niente Lerna, Turborepo, Nx). npm workspaces è sufficiente per due package con un solo livello di dipendenza (`app` → `core`). I comandi `npm run build/test --workspaces` funzionano out of the box.

### Separazione core / app (Fase 0)

**Scelta**: la libreria `mappit-core` è un package puro Node.js senza dipendenze UI. L'app Electron (`mappit-app`) la importa come dipendenza.

**Motivazione**: permette di usare il core come libreria programmatica, CLI standalone, o backend per l'app Electron. Facilita il testing (nessun mock di DOM/Electron nei test del core).

---

## TypeScript & Build

### TypeScript strict mode (Fase 0)

**Scelta**: `strict: true` nel `tsconfig.base.json`, target `ES2020`.

**Motivazione**: type safety critica per il modello dati unificato (5 formati diversi da normalizzare). `ES2020` supporta `BigInt`, optional chaining, nullish coalescing — sufficiente per Node.js 14+.

### tsc diretto, senza bundler per il core (Fase 0)

**Scelta**: la build del core usa `tsc --project tsconfig.json` direttamente, senza tsup, rollup o esbuild.

**Motivazione**: il core produce un output CommonJS per consumo diretto da Node.js e Electron. Non serve tree-shaking né minificazione. `tsc` genera anche `.d.ts` e source map senza configurazione aggiuntiva. Inizialmente era stato valutato tsup, poi rimosso per semplicità (eliminati ~30 pacchetti di dipendenza).

### Output CommonJS (Fase 0)

**Scelta**: `module: "CommonJS"` nel tsconfig del core.

**Motivazione**: massima compatibilità con Electron (che usa CommonJS di default nel main process) e con `require()` nei test. Il `package.json` espone `exports` con entry point `require` + `types`.

---

## Linting & Formatting

### ESLint 9 flat config + Prettier (Fase 0)

**Scelta**: ESLint 9 con `@typescript-eslint`, Prettier come formatter, `eslint-config-prettier` per evitare conflitti.

**Motivazione**: configurazione condivisa alla root del monorepo, un solo set di regole per tutti i package.

---

## Testing

### Vitest (Fase 0)

**Scelta**: Vitest come test runner, con supporto TypeScript nativo.

**Motivazione**: esecuzione nativa di `.ts` senza precompilazione, API compatibile con Jest, performance superiore. Configurato con `environment: 'node'` e `globals: true`.

### Test in cartella dedicata `tests/` (Fase 1 → separazione post-Fase 1)

**Scelta**: i test risiedono in `packages/core/tests/` con struttura che rispecchia `src/` (es. `tests/loaders/records.test.ts`), anziché co-locati accanto ai sorgenti.

**Motivazione**: separazione netta tra codice di produzione e codice di test. `tsconfig.json` esclude `tests/` dalla compilazione. `vitest.config.ts` punta a `tests/**/*.test.ts`.

### Fixture condivise alla root (Fase 0)

**Scelta**: i dati di test stanno in `fixtures/` alla root del monorepo (non dentro `packages/core`).

**Motivazione**: le stesse fixture possono essere usate da più package (core e app). Un singolo set di dati di riferimento per tutti e 5 i formati: `records.json`, `timeline-standard.json`, `timeline-semantic.json`, `timeline-ios.json`, `2024_JANUARY.json`.

---

## Modello dati

### Modello unificato `MappitDataset` (Fase 1)

**Scelta**: tutti i loader producono un unico tipo `MappitDataset` con due sezioni:

- `points: LocationPoint[]` — solo per Records.json (punti GPS grezzi)
- `timeline: TimelineEntry[]` — per tutti i formati Timeline (visite + attività)

**Motivazione**: il codice a valle (filtri, stats, export, UI) lavora su un'interfaccia sola, indipendentemente dal formato sorgente. La conversione `timelineToPoints()` colma il gap quando serve una vista a punti piatti.

### Coordinate in gradi decimali (Fase 1)

**Scelta**: tutte le coordinate nel modello unificato sono in gradi decimali (`lat: number, lng: number`), mai in formato E7.

**Motivazione**: evita conversioni ripetute al momento del rendering. I parser `e7ToDecimal`, `parseGeoUri` e `parseDegreeString` gestiscono la conversione una sola volta al caricamento.

### Normalizzazione attività via `activityGroupMapping` (Fase 1)

**Scelta**: ogni tipo di attività raw di Google (es. `IN_PASSENGER_VEHICLE`, `IN_BUS`, `JOGGING`) viene mappato a un gruppo stabile (es. `DRIVING`, `BUS`, `RUNNING`) al momento del parsing. Il mapping è centralizzato in `activity-mapping.ts` con 37 gruppi.

**Motivazione**: i tipi raw cambiano tra formati e versioni dell'export Google. Normalizzare al caricamento permette a filtri, stats e UI di usare nomi consistenti.

---

## Loader

### Un loader per formato, auto-detect (Fase 1)

**Scelta**: 5 loader separati (`parseRecords`, `parseTimelineStandard`, `parseTimelineSemantic`, `parseTimelineIos`, `parseTakeoutMonthly`) + `detectFormat()` / `parseAuto()` per auto-rilevamento.

**Motivazione**: ogni formato ha struttura e quirks diversi (coordinate E7 vs gradi°, geo: URI, offset in minuti). Loader separati mantengono la complessità isolata. `parseAuto` ispeziona la struttura JSON per scegliere il loader corretto.

### Parsing sincrono con JSON.parse (Fase 1)

**Scelta**: i loader accettano un oggetto JavaScript già parsato (non un file path). Lo streaming (`stream-json` / `big-json`) è demandato al layer CLI/app.

**Motivazione**: mantiene i loader puri e testabili (input → output). La responsabilità di leggere il file e gestire lo streaming è del chiamante. Questo permette di usare i loader anche con dati in memoria.

---

## Filtri (Fase 2)

### Filtri immutabili (Fase 2)

**Scelta**: `filterByDateRange`, `filterByArea` e `filterByActivityType` restituiscono sempre un **nuovo** `MappitDataset` — il dataset originale non viene mai modificato.

**Motivazione**: prevedibilità, composizione sicura di filtri in catena, nessun side effect. Il costo della copia è trascurabile rispetto alla dimensione dei dati (i punti sono oggetti piccoli).

### filterByDateRange con overlap (Fase 2)

**Scelta**: le timeline entry vengono mantenute se il loro intervallo `[startTime, endTime]` si **sovrappone** al range richiesto, non solo se iniziano dentro il range.

**Motivazione**: un'attività iniziata prima del range ma terminata dentro è comunque rilevante. Evita di perdere dati ai confini.

### filterByActivityType mantiene sempre le visite (Fase 2)

**Scelta**: quando si filtra per tipo di attività, le visite (`type: 'visit'`) non vengono mai rimosse.

**Motivazione**: le visite non hanno un `activityType` — escluderle per default significherebbe perdere la maggior parte dei dati timeline. Il filtro attività ha senso solo per i segmenti di spostamento.

### BoundingBox per filterByArea (Fase 2)

**Scelta**: il filtro geografico usa un semplice rettangolo `{ south, west, north, east }` in gradi decimali.

**Motivazione**: implementazione diretta e performante (confronto di 4 disuguaglianze). Sufficiente per la maggior parte dei casi d'uso. Un filtro a poligono arbitrario potrà essere aggiunto in futuro.

---

## Statistiche (Fase 2)

### Fallback al calcolo haversine per la distanza (Fase 2)

**Scelta**: `computeSummary` usa `distanceMeters` dal segmento se presente, altrimenti calcola la distanza dalla somma delle distanze haversine tra i punti del path.

**Motivazione**: non tutti i formati/segmenti includono `distanceMeters`. Il calcolo dal path è un'approssimazione ragionevole per avere statistiche anche con dati incompleti.

---

## Export (Fase 2)

### JSON export con simplify opzionale (Fase 2)

**Scelta**: `exportToJson()` applica `simplifyDataset()` di default (rimuove campi non essenziali) ma è disattivabile con `{ simplify: false }`.

**Motivazione**: l'output di default è compatto e leggibile. Per debug o backup completo, si può disattivare la semplificazione.

### KML: palette colori per gruppo attività (Fase 2)

**Scelta**: ogni gruppo di attività ha un colore fisso nella palette KML (es. WALKING = verde, DRIVING = blu, BUS = arancione). Le visite usano un'icona pushpin.

**Motivazione**: coerenza visiva quando il KML viene aperto in Google Earth. Colori allineati alle convenzioni di Google Maps.

### KML: fallback start→end se path vuoto (Fase 2)

**Scelta**: se un segmento di attività ha un path con meno di 2 punti, il KML genera una linea retta da `startLocation` a `endLocation`.

**Motivazione**: evita di perdere segmenti con path incompleto. Una linea retta è meglio di nessuna rappresentazione.

---

## Decisioni ancora aperte

| Tema                                                 | Stato                                  | Note                                                                   |
| ---------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| `recordsToTimeline` (clustering GPS → pseudo-visite) | Rimandato                              | Non bloccante per le prime release                                     |
| Streaming per file > 500 MB                          | Da implementare nel CLI/app            | I loader restano sincroni; lo streaming è responsabilità del chiamante |
| Framework UI renderer                                | Vanilla + Vite (iniziale)              | Possibile migrazione a Vue.js in futuro                                |
| Mappa: deck.gl vs Google Maps                        | deck.gl + Mapbox (iniziale)            | Migrazione a Google Maps per Place Details/autocomplete                |
| Cache Place Details                                  | File JSON in `app.getPath('userData')` | Da implementare in Fase 5–6                                            |

---

_Ultimo aggiornamento: 2026-02-25_
