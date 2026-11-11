# Storia, scelte e statistiche (Onore, Fama, Ambizione)

## Le tre statistiche
Valori 0–100 (iniziali in `config.virtues.list[].start`: Onore 40, Fama 20, Ambizione 30). Si vedono come tre barre compatte sul riquadro del personaggio (tocca le barre per la scheda con livelli e tratti). Cinque livelli, soglie in `config.virtues.ranks` (0/20/40/60/80), nomi in `list[].ranks`.

**Tratti passivi** (`list[].perks["<livello>"] = { fx, text }`): valgono a ogni duello e agli incassi. Chiavi di `fx`: `block`, `energy`, `draw`, `foeHp`, `hp` (come i bonus di scelta) e `goldPct` (% sull'oro delle vittorie). All'inizio nessuno è attivo: si ottengono solo con scelte coerenti.

| | basso (livello 0) | alto (livello 3 / 4) |
|---|---|---|
| Onore | colpi sporchi: nemico −6% PV, −10% oro | scudo 4 / 8 a inizio duello |
| Fama | Ombra: +1 carta al primo turno | +10% / +25% oro dalle vittorie |
| Ambizione | Appagato: 3 di scudo | +1 energia / +1 energia e +1 carta ma −4 PV |

## Scene (`choices`)
Ogni scena è legata a isola (`region`) e capitolo (`at`, 0–4: arriva prima del duello `at`). Campi nuovi:
- `needs`: condizione perché la scena compaia. Le scene con `needs` hanno la **precedenza** su quelle generiche dello stesso capitolo (servono per i richiami).
- `extra`: elenco di `{ if, text }`: paragrafi aggiunti al testo quando la condizione è vera (richiami a scelte passate).
- opzioni: `v` (variazioni di `honor`/`fame`/`ambition`, **nascoste** finché il giocatore non sceglie), `flag` (flag di storia impostati, separati da virgola), `req` (requisito per poterla scegliere) e `lock` (frase mostrata se è bloccata).
- Una condizione (`needs`, `if`, `req`) è `{ min: {honor: 40}, max: {fame: 30}, flag: "a,b", noFlag: "c" }`. Ogni scena deve avere almeno un'opzione senza `req`. Le scene possono avere 3 o 4 opzioni.
- Le ricompense (`fx`) restano piccole e bilanciate (valore 1,1–1,9): la scelta deve nascere dal significato, non dai numeri.

## Epiloghi (`epilogues`)
Dopo la vittoria sull'ultima isola compare l'epilogo: il primo, in ordine, le cui `needs` valgono (l'ultimo non ha condizioni). Come le scene, può avere `extra` condizionali. Il finale dipende dalla scelta del Titano (`end_throne`, `end_break`, `end_legend`, `end_fighter`) e dalle storie vissute.

## Cast e flag principali
Gorin (`gorin_bond`, `gorin_kept`, `gorin_left`, `gorin_doubt`), Idris (`idris_ally`, `idris_rival`, `betrayed_idris`, `idris_united`), Lia Marek (`lia_met`, `lia_ally`, `lia_hype`, `lia_exposes`), il Notaio (`pact`, `defied`, `holds_ledger`, `burned_ledger`, `notaio_heir`), e le scelte d'arena (`saved_recruit`, `shared_water`, `shared_core`, `free_route`, `ate_fruit`, `seed_planted`, `demon_pact`, …). L'Editor avvisa se una condizione usa un flag che nessuna scelta imposta.
