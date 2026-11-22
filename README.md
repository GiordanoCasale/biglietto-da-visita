# Biglietto da visita

Sito personale in tre lingue (italiano, inglese, persiano), fatto solo di pagine statiche:
funziona su GitHub Pages, senza server.

## Come funziona

- **`admin.html` (pannello)**: si compilano foto, testi, link social, scritti e documenti.
  Tutto viene salvato **solo nel browser** di chi lo usa (IndexedDB): nessun altro lo vede.
- **`index.html?anteprima`**: mostra il sito con i contenuti del pannello, solo su quel dispositivo.
- **`index.html`**: mostra la versione pubblicata (`content/profile.json`).
  Finché non c'è, compare "Presto online".

## Copie (esporta / apri)

Dal pannello, "Esporta copia" scarica un file `biglietto-AAAA-MM-GG.json` con tutto dentro
(testi, foto, documenti). Serve:
- come backup, o per continuare su un altro dispositivo ("Apri una copia");
- per pubblicare il sito.

## Pubblicare

```bash
node strumenti/pubblica.js percorso/biglietto-AAAA-MM-GG.json
git add content
git commit -m "Aggiorna contenuti"
git push
```

Lo script scrive `content/profile.json` e `content/files/`. GitHub Pages aggiorna il sito in 1–2 minuti.
Per tornare a "Presto online" basta cancellare la cartella `content` e fare push.

## Prova in locale

```bash
node server.js
```

Sito: http://localhost:8080 · Pannello: http://localhost:8080/admin.html

## Note

- Quando cambi CSS o JS, aumenta il numero `?v=N` nei link di `index.html` e `admin.html`,
  altrimenti i browser possono tenere per ~10 minuti la versione vecchia.
- I testi dell'interfaccia nelle tre lingue sono in `common.js`.
