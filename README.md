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
- `src/data.ts`, `src/config.ts`, `src/regions.ts` — caricano `data/game.json`.
- `src/policies.ts` — regole ancora da decidere, isolate.
- `src/save.ts` — salvataggio locale (localStorage, versionato).
- `src/main.ts` — interfaccia; `src/art.ts` immagini; `src/audio.ts` audio procedurale; `src/fx.ts` particelle.
- `tests/` — test con il runner di Node (`tsx --test`).
- `docs/` — architettura e note per il multiplayer.

## Pubblicare su GitHub Pages
1. Crea un repository e fai push del progetto sul ramo `main`.
2. In *Settings → Pages* scegli **GitHub Actions** come sorgente.
3. Il workflow `.github/workflows/pages.yml` esegue typecheck, test e build, poi pubblica il sito.
