# Comboo

RPG di carte roguelike a turni, giocabile da browser (PC e smartphone), single-player, senza server.
Il protagonista sale di potenza isola dopo isola: da combattente umano a livelli divini.

## Avvio rapido
```bash
npm install
npm run dev        # http://localhost:5173 (ricompila a ogni modifica)
npm test           # test delle regole di gioco
npm run build      # dist/game.js (aprire index.html)
npm run build:single   # dist/comboo.html: file unico giocabile (itch.io, condivisione)
```

## Struttura
- `data/game.json` — **tutti i contenuti**: carte, equipaggiamenti, nemici, isole, storie, bilanciamento. Vedi `data/README.md`.
- `assets/` — le tue immagini personalizzate (vedi `assets/README.md`).
- `src/engine.ts` — regole (pure, senza DOM): run, combattimento, store, economia, esiti.
- `src/gamedata.ts` — sorgente unica dei dati (game.json o dati personalizzati dell'Editor) nella lingua scelta; `src/data.ts`, `src/config.ts`, `src/regions.ts` ne derivano le strutture.
- `src/editor.ts` + `src/editor-data.ts` — **Editor** (menu principale → 🛠 Editor): carte, equipaggiamenti, stili, isole/capitoli con palette colori, scelte, mosse nemiche, nomi delle immagini attese, traduzioni; **Esporta JSON** scarica il nuovo `data/game.json`.
- `src/i18n.ts`, `src/locales.ts`, `data/locales/` — traduzione dell'interfaccia (vedi `data/locales/README.md`).
- `src/policies.ts` — regole ancora da decidere, isolate.
- `src/save.ts` — salvataggio locale (localStorage, versionato).
- `src/main.ts` — interfaccia; `src/art.ts` immagini; `src/audio.ts` audio procedurale; `src/fx.ts` particelle.
- `tests/` — test con il runner di Node (`tsx --test`).
- `docs/` — architettura e note per il multiplayer.

## Editor
Dal menu principale: **🛠 Editor**. Lavora su una bozza (salvata nel browser): ▶ *Prova nel gioco* la usa subito senza toccare il repository, ↩ *Dati originali* torna a `data/game.json`, ⬇ *Esporta JSON* scarica il file completo da mettere in `data/`. La scheda *Immagini* elenca i nomi dei file attesi in `assets/` (e genera uno script per rinominare le immagini se cambi gli id).

## Pubblicare su GitHub Pages
1. Crea un repository e fai push del progetto sul ramo `main`.
2. In *Settings → Pages* scegli **GitHub Actions** come sorgente.
3. Il workflow `.github/workflows/pages.yml` esegue typecheck, test e build, poi pubblica il sito.

## Tutorial
Dal menu principale: **📘 Tutorial**. Gira su una run di prova (mai salvata) con mano e nemico predefiniti; `src/tutorial.ts` contiene i passi e blocca ogni azione non prevista. `tests/tutorial.test.ts` verifica che il percorso guidato porti davvero alla vittoria: se cambi le regole o le carte usate dal tutorial, aggiorna entrambi.
