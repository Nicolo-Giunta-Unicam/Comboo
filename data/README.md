# Dati di gioco (`game.json`)
Tutto il contenuto è qui; dopo ogni modifica esegui `npm run build` (e `npm test`).
- `config`: parametri di bilanciamento (vita, oro, slot, energia, combo, difficoltà nemici, `matchesPerIsland`...).
- `baseDeck` / `baseMoves`: le 10 carte iniziali e le loro definizioni.
- `equipment[]`: `island` (da quale isola compare nello store), `moves` (3 mosse) e `advanced` (mossa acquistabile). `cost` è facoltativo su ogni mossa: se manca è calcolato dalla forza.
- Effetti (`effect`): `dmg`, `hits`, `block`, `dur` (turni; 0 = finché abbattuta), `heal`, `draw`, `energy`, `link: {from, dmg|block|draw|energy}` (bonus se la carta precedente è `from`).
- `enemyMoves[]`: carte nemiche (valori = moltiplicatori della potenza del nemico).
- `regions[]`: isole in ordine di sblocco; 5 `enemies` ciascuna (l'ultimo è il boss, con `hpMul`/`atkMul`), `enemyMoves` ammesse, tema (`theme`), posizione sulla mappa (`x`,`y`).
- `equipment[].kind`: natura dell'oggetto, usata per il racconto di come è stato ottenuto: `gear` (oggetto: trovato, ricevuto o costruito), `implant` (cyberware: installato o assemblato), `body` (potenziamento del corpo: risvegliato o allenato), `style` (stile di combattimento: insegnato o appreso), `arcane` (artefatto/potere: trovato o concesso). Le mosse sono sempre tecniche apprese.
- `regions[].enemies[].story`: breve racconto che introduce il duello (`{nome}` = nome del protagonista). `lore` è una nota sul nemico; `concept`/`story`/`hero` della regione sono appunti di design.
- Fuga: un effetto `{"flee": true, "req": {"hpBelow": 0.5, "minTurn": 3}}` fa lasciare il duello senza conseguenze se i requisiti sono soddisfatti (`hpBelow` = PV sotto quella frazione, `minTurn` = dal turno N). Ricordati di indicare `cost`. `config.mercy` regola la probabilità di essere risparmiati chiedendo pietà (base, bonus a PV bassi, malus contro i boss).
- `styles[]`: stili di combattimento iniziali (assegnati da una slot machine a inizio run): 10 carte ciascuno, che usano gli id di `baseMoves`.
- Vita: `woundedBelow` (se un duello finisce sotto questa frazione di PV, il successivo parte a `woundedStart`), `healCost` (prezzo della cura nello store). Altrimenti si parte sempre a PV pieni.
