# Architettura
- **Logica separata dall'interfaccia**: `engine.ts` non usa il DOM e muta uno stato serializzabile (`Run`). L'interfaccia (`main.ts`) chiama le funzioni dell'engine e si ridisegna.
- **Dati separati dal codice**: carte, equipaggiamenti, nemici e isole stanno in `data/game.json`; `config.ts`/`data.ts`/`regions.ts` li caricano e ne derivano i costi.
- **Determinismo**: ogni run ha un generatore casuale con seme nello stato (`rng`). Stesso stato + stessi comandi = stesso risultato.
- **Esiti isolati**: `resolveOutcome` è l'unico punto in cui un duello termina (vittoria, sconfitta, fuga, pietà).
- **Salvataggio**: `save.ts` valida lo stato al caricamento; gli stati non validi vengono scartati.
