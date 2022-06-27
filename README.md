# mappit-core

google locations plot tool with command line interface

## install

`npm install`

## example usage

$ npm start -- --loadfile ./Takeout/location_history/location_history.json --filterdate '09-01-2019' '09-09-2019' --plot heatmap --render

## Google's description of location_history.json

Di seguito puoi trovare tutti i formati possibili inviati al tuo archivio:
Cronologia delle posizioni
Dati sulla posizione raccolti durante l'adesione alla Cronologia delle posizioni.

### JSON

Il file Cronologia delle posizioni JSON descrive i segnali relativi alla posizione del dispositivo e i metadati associati raccolti mentre la Cronologia delle posizioni era attiva e che non hai successivamente eliminato.

-locations: tutti i record di posizione.  
-timestampMs(int64): timestamp (UTC) in millisecondi per la posizione registrata.  
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

### KML

Un file KML memorizza informazioni sulla modellazione geografica in formato XML che possono essere usate per mostrare dati geografici. Per ulteriori informazioni, consulta la documentazione su KML. Puoi caricare il file KML in Google Earth per visualizzare tutte le località che hai visitato.

### Cronologia delle posizioni semantica

Cronologia delle posizioni semantica composta da segmenti relativi ad attività e visite a luoghi dedotte.

### JSON

I file JSON della cronologia delle posizioni semantica descrivono gli oggetti della cronologia di Google, come segmenti relativi ad attività e visite a luoghi dedotte tra le visite ai luoghi.

## Roadmap

The idea could be to have a node-friendly library to reduce data amount (eg simply filtering on date), and then a webapp / electron app to render the data.

- Manage big json data (bigger than 500 MB)
- Replace plotly with deck.gl
- Download canvas and result data

## Hints

- Mapbox styles
- Plotly or deckgl?
