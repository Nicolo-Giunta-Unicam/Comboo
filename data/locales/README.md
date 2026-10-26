# Lingue

Il gioco ha **due livelli di traduzione**, indipendenti:

1. **Interfaccia** (menu, pulsanti, tutorial, messaggi): `data/locales/<codice>.json`, un dizionario `{"Testo italiano": "Translation"}`.
   Il testo sorgente nel codice è in italiano e fa da chiave. I segnaposto `{0}`, `{1}`… rappresentano numeri, nomi o frammenti variabili e possono cambiare ordine nella traduzione.
   Un blocco con tag inline (`<b>…</b>`) è un'unica voce. Le voci con valore vuoto o mancanti restano in italiano.
2. **Contenuti** (nomi/descrizioni di carte, equipaggiamenti, stili, isole, nemici, storie, scelte): dentro `data/game.json`, nella sezione `"i18n": { "en": { "move.jab.name": "Jab", … } }`.
   Si modificano dall'**Editor** scegliendo la *Lingua di modifica* (i campi mostrano il testo italiano come suggerimento).

## Aggiungere una lingua (es. spagnolo)

1. `npm run i18n:extract es` crea/aggiorna `data/locales/es.json` con tutte le chiavi (valore vuoto = da tradurre). Dopo ogni modifica al codice rilancia lo stesso comando: aggiunge le chiavi nuove e rimuove quelle obsolete.
2. Traduci i valori in `es.json`.
3. Registra la lingua in `src/locales.ts` (un `import` e una riga in `LOCALES`).
4. Nell'Editor, scheda *Generale*, apri la lingua `es` e traduci i contenuti (o aggiungila con "Aggiungi lingua" se non compare), poi **Esporta JSON** e sostituisci `data/game.json`.
5. `npm run build`. La lingua compare nel menu e nelle impostazioni; la prima volta si sceglie in automatico in base al browser.

`npm run i18n:extract` senza argomenti scrive solo il modello `data/locales/_template.json` (tutte le chiavi, vuote).

Per cambiare lingua, il gioco ricarica la pagina (la run in corso è già salvata).
