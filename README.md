# mappit-core

google locations plot tool with command line interface

## install

`npm install`

## example usage

$ npm start -- --loadfile ./Takeout/location_history/Records.json --filterdate '2022-08-06' '2022-08-17' --plot heatmap --render

// IMPLEMENTED CLI COMMANDS:
// --loadfile : load positions from file
// --filterdate [start, end] : filter by date
// --TODO filterspace [lat_max, lat_min, lng_max, lng_min] : filter by position
// --plot byactivitytype/byvelocity/heatmap : prepare data to be rendered in each format
// --render : render plot using electron
// --writeOutput : write filtered data to file

## Google's description of location_history.json

Di seguito puoi trovare tutti i formati possibili inviati al tuo archivio:
Cronologia delle posizioni
Dati sulla posizione raccolti durante l'adesione alla Cronologia delle posizioni.

### JSON

Il file Cronologia delle posizioni JSON descrive i segnali relativi alla posizione del dispositivo e i metadati associati raccolti mentre la Cronologia delle posizioni era attiva e che non hai successivamente eliminato.

-locations: tutti i record di posizione.  
-timestampMs(int64): timestamp (UTC) in millisecondi per la posizione registrata. -> è diventato `timestamp` espresso in stringa ISO
-latitudeE7(int32): il valore di latitudine della posizione in formato E7 (gradi moltiplicati per 10^7 e arrotondati al numero intero più vicino).  
-longitudeE7(int32): il valore di longitudine della posizione in formato E7 (gradi moltiplicati per 10^7 e arrotondati al numero intero più vicino).  
-accuracy(int32): raggio approssimativo di precisione della posizione in metri.  
-velocity(int32): velocità in metri al secondo.  
-heading(int32): gradi a est del nord geografico.  
-altitude(int32): metri sopra l'ellissoide di riferimento WGS84.  
-verticalAccuracy(int32): precisione verticale calcolata in metri.  
-activity: informazioni sull'attività svolta nella posizione.  
-timestampMs(int64): timestamp (UTC) in millisecondi per l'attività registrata.  
-type: descrizione del tipo di attività.  
-confidence(int32): affidabilità associata al tipo di attività specificato.  
-source(string): l'origine da cui è stata recuperata la posizione, generalmente GPS, CELL o WIFI.  
-deviceTag(int32): un identificatore intero (specifico della Cronologia delle posizioni) associato al dispositivo che ha caricato la posizione.  
-platform(string): la piattaforma che descrive il dispositivo e varie informazioni sulla build.  
-platformType(string): il tipo di piattaforma del dispositivo, che può essere ANDROID, IOS o UNKNOWN.  
locationMetadata: un elenco ripetuto di ricerche di reti Wi-Fi formate da punti di accesso. Ogni punto di accesso è formato dall'intensità del segnale in dBm (decibel per milliwat) e dal proprio indirizzo MAC.

Vedi anche https://locationhistoryformat.com/

### KML

Un file KML memorizza informazioni sulla modellazione geografica in formato XML che possono essere usate per mostrare dati geografici. Per ulteriori informazioni, consulta la documentazione su KML. Puoi caricare il file KML in Google Earth per visualizzare tutte le località che hai visitato.

### Cronologia delle posizioni semantica

Cronologia delle posizioni semantica composta da segmenti relativi ad attività e visite a luoghi dedotte.

### JSON

I file JSON della cronologia delle posizioni semantica descrivono gli oggetti della cronologia di Google, come segmenti relativi ad attività e visite a luoghi dedotte tra le visite ai luoghi.

## Roadmap

The idea could be to have a node-friendly library to reduce data amount (eg simply filtering on date), and then a webapp / electron app to render the data.

- [x] Manage big json data (bigger than 500 MB)
- [ ] Replace plotly with deck.gl
- [ ] Download canvas and result data
- [ ] Show progress bar https://github.com/npkgz/cli-progress
- [ ] Reworking plot types
- [ ] Merge multiple Records.json

## Hints

- Mapbox styles
- Plotly or deckgl?
