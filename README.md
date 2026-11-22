# Biglietto da visita

Sito personale in tre lingue (italiano, inglese, persiano) con un pannello per modificarlo.

## Avvio

```bash
node server.js
```

- Sito: http://localhost:8080
- Pannello: http://localhost:8080/admin

Serve solo Node.js (nessuna installazione di pacchetti).

## Password

Al primo avvio il server crea una password e la scrive in `data/password-iniziale.txt`.
Cambiala dal pannello (sezione *Sicurezza*): il file viene cancellato automaticamente.
In alternativa, al primo avvio puoi impostarla con la variabile `ADMIN_PASSWORD`.

## Dove stanno i dati

- `data/profile.json`: testi, link, scritti, elenco dei file
- `data/auth.json`: password (cifrata)
- `uploads/`: foto e documenti caricati

Per fare un backup basta copiare le cartelle `data` e `uploads`.

## Struttura

- `server.js`: server, salvataggio e caricamento file
- `public/index.html` + `site.js`: pagina pubblica
- `public/admin.html` + `admin.js`: pannello
- `public/common.js`: testi dell'interfaccia nelle tre lingue
- `public/styles.css`: stile (palette rosa cipria, tema chiaro e scuro)
