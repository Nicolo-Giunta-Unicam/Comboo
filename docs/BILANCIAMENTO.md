# Bilanciamento di Comboo — rapporto e modifiche

## Revisione 2 (richieste dell'autore)

Dopo il primo giro di bilanciamento sono state applicate queste decisioni; il resto del documento descrive il lavoro di base e resta valido salvo dove indicato.

1. **Pescaggio fisso a 2 carte per turno** (`handTarget` torna a 0: la regola resta nel motore e nell'Editor). In più, **se nel turno hai fatto almeno una combo, nel turno successivo peschi 1 carta in più** (`comboDraw`, 1 di default). Nel combattimento compare il segnale "🂠 +1 al prossimo turno" appena la combo è fatta; tutorial e traduzione inglese aggiornati.
2. **Scelte di storia ridimensionate.** Ogni opzione ha **al massimo 2 effetti** e vale ~1,5 punti (prima fino a 3 effetti e fino a 3,5 punti: es. energia +2, 3,5 unità d'oro con −6 PV, pesca 2 + scudo 18). Limiti: energia e pesca al massimo 1, scudo al massimo 8, PV del nemico al massimo −10, oro al massimo 2,5. Le tre opzioni di una scena sono di tipo diverso (oro, scudo, pesca, energia, nemico indebolito) con scarto massimo 0,5 punti; l'Editor segnala come avviso chi esce da 1,1–1,9 punti o supera i 2 effetti, e il test lo verifica per tutte le 60 scene.
3. **Pugilato:** mazzo iniziale **6 Jab, 2 Guardia, 2 Respiro** (prima 6/3/1).
4. **Ogni nemico ha un moveset proprio e riconoscibile** (30 nemici, 30 insiemi di mosse diversi: un test lo verifica). Il campo `moves` di ogni nemico (modificabile dall'Editor, scheda *Isole e capitoli*) elenca gli id delle sue mosse; ripetere un id lo rende più probabile. Le mosse del nemico sono mostrate nella scheda del capitolo. Per renderli distinguibili ho aggiunto **8 mosse nemiche** (Doppio colpo, Salva, Contrattacco, Fortezza, Riparazione, Morso vampirico, Schianto, Pungiglione); le mosse con attacco *e* difesa (Contrattacco) ora schierano entrambi. `enemy.normalize` calcola la media sul moveset del singolo nemico, quindi la difficoltà resta calibrata anche se il moveset cambia.

Moveset e moltiplicatori (PV·attacco) calibrati di nuovo con il simulatore:

| Capitolo | Nemico | Mosse | Moltiplicatori |
|---|---|---|---|
| Fighting Arena 1 | Sparring partner | Diretto · Parata | 0.79·0.89 |
| Fighting Arena 2 | Pugile di strada | Raffica · Doppio colpo · Diretto | 1.00·1.00 |
| Fighting Arena 3 | Campione regionale | Colpo pesante · Parata · Diretto · Contrattacco | 0.86·0.93 |
| Fighting Arena 4 | Peso massimo | Colpo pesante · Schianto · Parata | 1.00·1.00 |
| Fighting Arena 5 | Leggenda del ring | Contrattacco · Doppio colpo · Colpo pesante · Fortezza · Diretto | 1.03·1.03 |
| Campo di battaglia 1 | Recluta cibernetica | Salva · Diretto · Parata | 1.00·1.00 |
| Campo di battaglia 2 | Cecchino | Razzo · Diretto · Parata | 1.07·1.03 |
| Campo di battaglia 3 | Soldato in esoscheletro | Colpo pesante · Fortezza · Diretto · Salva | 0.92·0.96 |
| Campo di battaglia 4 | Mech da guerra | Salva · Razzo · Riparazione | 1.01·1.01 |
| Campo di battaglia 5 | Generale corazzato | Razzo · Contrattacco · Fortezza · Salva · Colpo pesante | 1.26·1.13 |
| Deserto 1 | Predone | Diretto · Pungiglione · Raffica | 0.82·0.91 |
| Deserto 2 | Scorpione gigante | Pungiglione · Morso vampirico · Parata | 0.70·0.84 |
| Deserto 3 | Mummia guerriera | Assorbimento · Colpo pesante · Riparazione · Parata | 0.67·0.83 |
| Deserto 4 | Colosso di sabbia | Schianto · Fortezza · Colpo pesante · Rigenerazione | 0.80·0.90 |
| Deserto 5 | Faraone solare | Razzo · Morso vampirico · Riparazione · Pungiglione · Fortezza | 1.00·1.02 |
| Oceano 1 | Squalo corazzato | Morso vampirico · Colpo pesante · Fortezza | 0.87·0.94 |
| Oceano 2 | Sirena sonica | Onda d'urto · Assorbimento · Parata | 1.06·1.03 |
| Oceano 3 | Pirata dell'energia | Razzo · Salva · Contrattacco | 1.03·1.01 |
| Oceano 4 | Kraken | Raffica · Schianto · Fortezza · Rigenerazione | 0.90·0.95 |
| Oceano 5 | Leviatano | Schianto · Onda d'urto · Riparazione · Fortezza · Colpo pesante | 0.98·1.01 |
| Foresta 1 | Lupo mutante | Morso vampirico · Doppio colpo · Raffica | 0.62·0.80 |
| Foresta 2 | Spirito della foresta | Rigenerazione · Assorbimento · Onda d'urto · Parata | 0.64·0.81 |
| Foresta 3 | Treant antico | Schianto · Rigenerazione · Fortezza | 0.60·0.79 |
| Foresta 4 | Cacciatore del frutto | Pungiglione · Razzo · Salva · Contrattacco | 0.75·0.87 |
| Foresta 5 | Albero del mondo | Rigenerazione · Riparazione · Schianto · Onda d'urto · Fortezza · Assorbimento | 0.86·0.95 |
| Vulcano 1 | Salamandra celeste | Onda d'urto · Raffica · Morso vampirico · Diretto | 0.61·0.79 |
| Vulcano 2 | Golem di lava | Schianto · Fortezza · Colpo pesante | 0.70·0.85 |
| Vulcano 3 | Demone ardente | Colpo cataclismico · Assorbimento · Morso vampirico · Contrattacco | 1.00·1.00 |
| Vulcano 4 | Drago cataclismico | Colpo cataclismico · Razzo · Onda d'urto · Salva | 0.86·0.93 |
| Vulcano 5 | Titano del magma | Colpo cataclismico · Schianto · Riparazione · Fortezza · Colpo pesante | 0.82·0.92 |

Risultati di questa revisione (150 run complete per stile, bot esperto): arena media **14,3** (pugilato), **15,6** (taekwondo), **15,5** (jujitsu); run completate 0% / 4% / 9%. Bot "casual": arena media 5,8–6,4, vittoria nell'arena 1 85–99%. Differenza tra stili (vittorie al primo tentativo, media sulle 30 arene): 0,90–0,91.

Avvertenza: nelle prime arene la vittoria è quasi certa anche con difficoltà molto diverse (soglia improvvisa), quindi per le arene 1–7 i moltiplicatori sono stati limitati a ≤ 1,0–1,1 per lasciare margine ai giocatori meno esperti.

---

Il bilanciamento è stato fatto con un **simulatore** (`scripts/sim.ts`) che gioca intere run con il motore reale, senza interfaccia. Il bot sa comprare equipaggiamenti, mosse ed energia, curare, scegliere le scelte di storia, potare il mazzo e giocare le carte con combo e difesa. Ne esistono tre livelli: **smart** (giocatore esperto), **casual** (giocatore medio, sbaglia e non pota il mazzo) e **naive** (quasi casuale). Il bot non è un umano: i numeri sono utili soprattutto *in confronto* tra versioni, ma la curva di difficoltà è stata calibrata su di lui.

```
npm run sim -- --runs 200 --style boxing --skill smart          # run complete
npm run sim -- --runs 100 --immortal --style jujitsu            # difficoltà di ogni arena, indipendente dalle precedenti
npm run sim -- --runs 100 --set config.enemy.hpGrowth=1.09 --usage   # prova di una modifica senza toccare il JSON
```
`--set percorso=valore` modifica i dati in memoria; `--data file.json` usa un altro game.json; `--usage` mostra quali carte vengono giocate.

## Problemi trovati (dati originali)

1. **Muro di difficoltà alle arene 8–10.** I nemici crescevano del 13% di PV e del 9,5% di attacco per arena, ma i PV del giocatore restavano quasi fermi (da 41 a ~52 con gli equipaggiamenti). Il bot esperto arrivava in media all'arena ~8 e **non completava mai il gioco**. Alla fine dell'isola 2 un turno nemico toglieva ~20–23 PV a un giocatore con ~52 PV, e il nemico moriva dopo 4–5 turni.
2. **Morti "al primo round".** Il numero di carte giocate dal nemico saliva a scatti (2 → 3 all'arena 9, → 4 alla 17, → 5 alla 25) e i mazzi di mosse nemiche delle isole non sono equivalenti: danno medio per carta ×1,13 pugilato, ×1,30 campo di battaglia, ×1,13 deserto, ×1,48 oceano, **×0,86 foresta**, **×1,74 vulcano**. Risultato: nei test il danno del primo turno passava da ~13 a ~50 PV entrando nell'oceano, mentre la foresta (con rigenerazione e assorbimento) era molto più morbida. Questo spiega "alcuni avversari troppo facili, altri ti uccidono subito". In più solo il boss aveva moltiplicatori: i 4 nemici normali di un'isola avevano tutti le stesse statistiche.
3. **Mano che si svuota.** Mazzo iniziale da 10 carte, 5 in mano e 2 pescate a turno: il mazzo finiva al turno 3–4. Rimescolare costava **3 energia (tutta l'energia iniziale) per una sola carta**. Con molte combo la mano si azzerava, e **comprare energia non serviva**: anche con 5–6 energia il bot giocava solo 2,2–2,8 carte a turno perché non aveva carte. Un giocatore "medio" (bot casual) vinceva solo il 31–38% delle partite dell'arena 1 contro il 99% dell'esperto.
4. **Carte tardive inutilizzabili.** Il costo automatico era potenza ÷ 5 (fino a 8 energia): le carte forti dei livelli avanzati costavano 6–8 energia (con max 10 e un prezzo crescente per ottenerle) a parità di rendimento delle carte economiche. Dopo l'arena ~15 il bot giocava ancora soprattutto carte delle prime isole (Fasce, Lame multicolpo): intere linee (Aura, Reattore, Scatto, Frutto, Fenditura) non venivano mai giocate. Inoltre il bonus danni degli equipaggiamenti si somma a *ogni colpo*, quindi le carte multicolpo a basso costo battevano sempre quelle a colpo singolo.
5. **Stili sbilanciati.** I mazzi iniziali di Taekwondo e Jujitsu (calcio 5, rotazione con combo, parata+pesca, presa+scudo, leva da 6 per 2 turni) erano più forti del Pugilato: a parità di nemici il Pugilato arrivava in media fino all'arena ~10, gli altri stili fino alla ~16.
6. **Equipaggiamenti con una sola mossa avanzata** (Corazza, Titano, Pelle, Rigenerazione, Fenditura, Aura): poche scelte nello store e poca varietà.

## Modifiche (tutte in `data/game.json`, salvo le regole nuove nel motore)

### Regole nuove (motore, attivabili da `config`)
| Chiave | Valore | Effetto |
|---|---|---|
| `handTarget` | ~~5~~ → 0 (vedi Revisione 2) | a inizio turno si pesca max(`drawPerTurn`, 5 − carte in mano): la mano si riempie e l'energia comprata serve |
| `hpPerArena` | 3 | +3 PV massimi per ogni arena vinta |
| `enemy.normalize` | 1,1 | ogni isola infligge in media gli stessi danni per carta (le isole restano diverse per tipo di colpi, non per quantità) |
| `enemy.burstCap` | 0,5 | un turno nemico non può togliere più del 50% dei PV massimi: **niente più morti al primo round** (il test lo verifica) |
| `cost.tier` | 0,15 | le carte delle isole avanzate costano meno a parità di potenza (isola n: ÷(1+0,15·n)) |
| `discardDrawCards` | 1 | carte pescate dopo il rimescolo (configurabile) |

### Parametri
| Chiave | Prima | Dopo |
|---|---|---|
| `discardDrawCost` (rimescolo a mazzo finito) | 3 | **2** |
| `cost.div` / `cost.max` | 5 / 8 | **6 / 6** |
| `enemy.hpBase` / `atkBase` | 22 / 5 | **34 / 7,5** |
| `enemy.hpGrowth` / `atkGrowth` | 1,13 / 1,095 | **1,085 / 1,035** |
| `enemy.playsEvery` | 8 | **10** (meno scatti nel numero di carte nemiche) |

Moltiplicatori per capitolo (PV·attacco), calibrati in modo che ogni arena abbia la difficoltà obiettivo (si vedono e si modificano dall'Editor, scheda *Isole e capitoli*):

| Isola | Capitoli 1–5 (boss ultimo) |
|---|---|
| Fighting Arena | 0.82·0.83 / 0.89·0.88 / 0.98·0.91 / 1.10·0.96 / 1.43·1.20 |
| Campo di battaglia | 1.35·1.10 / 1.54·1.17 / 1.45·1.19 / 1.50·1.21 / 1.82·1.35 |
| Deserto | 1.06·1.03 / 0.99·1.00 / 1.23·1.10 / 1.35·1.15 / 1.66·1.29 |
| Oceano | 1.09·1.04 / 1.46·1.20 / 1.49·1.21 / 1.42·1.18 / 1.53·1.24 |
| Foresta | 0.94·0.97 / 0.99·1.00 / 0.94·0.97 / 0.98·0.99 / 1.16·1.09 |
| Vulcano | 0.86·0.93 / 0.84·0.92 / 1.07·1.03 / 0.95·0.98 / 1.03·1.03 |

### Carte e stili
- **Pugilato:** mazzo iniziale da 5/3/2 a **6 Jab / 3 Guardia / 1 Respiro**; Respiro dà 3 di guardia (era 2).
- **Taekwondo:** Calcio frontale 5→4 danni, Calcio circolare: bonus collegamento 2→1, Schivata 3→2 di guardia.
- **Jujitsu:** Leva articolare 6→5 di guardia, Proiezione: bonus collegamento 4→3.
- **9 carte nuove** (acquistabili nello store, mosse avanzate) per dare una seconda scelta alle linee con una sola:
  Rabbia del ferito (Fasce, con PV < 50%: 11×2), Guardia attiva (Postura: guardia 6 + pesca 1), Cambio di ritmo (Gioco di gambe: pesca 2 + 1 energia), Barriera reattiva (Corazza: guardia 10 per 2 turni + pesca), Frantumazione (Titano: 10×3), Pelle di roccia (Pelle: guardia 10 per 2 turni + cura 6), Rigenerazione rapida (Rigenerazione: cura 12 + pesca), Strappo dimensionale (Fenditura: 14 + collegamento +10), Esplosione di ki (Aura: 16×2 + pesca).
- Tutorial e traduzione inglese aggiornati ai nuovi numeri (mano a 5, rimescolo a 2 energia).

## Risultati dopo il bilanciamento

Obiettivo: arene normali ~90–99% di vittorie per l'esperto, boss 80–50% in crescita; completamento dell'intera run ~2–5% per il bot esperto (un giocatore umano forte può fare meglio).

Vittorie per arena (run complete, 150 per stile, bot esperto); i boss sono le arene 5, 10, 15, 20, 25, 30:

| Stile | Arena media raggiunta | Run completate | Boss 5 / 10 / 15 / 20 / 25 / 30 |
|---|---|---|---|
| Pugilato | 12,9 | 2% | 84 / 87 / 78 / 71 / 50 / 50 |
| Taekwondo | 14,9 | 2% | 93 / 81 / 75 / 69 / 72 / 44 |
| Jujitsu | 15,5 | 4% | 94 / 82 / 79 / 81 / 68 / 54 |

(prima: arena media ≈ 8, 0% di run completate). Il bot **casual** raggiunge in media l'arena 5,6: vince il 100% dell'arena 1 e ~84–95% delle arene 2–4, il primo boss è al ~48%. Nelle arene normali l'esperto vince il 90–100%; la durata dei combattimenti scende da ~5,5 turni (arena 1) a ~2,5–3 (fine gioco, con 10 energia).

Controlli fatti: la differenza tra stili (vittorie al primo tentativo, media sulle 30 arene) è 0,89–0,92; con `burstCap` il danno massimo subito nel primo turno è ≤ 50% dei PV massimi; i test automatici (50) coprono le nuove regole.

## Cosa resta da tenere d'occhio
- Il bot non conosce tutte le sinergie (es. Adrenalina/Clone sono usate in modo semplice): un umano potrebbe trovare combo più forti. Se un giocatore esperto completa troppo spesso, alza `hpMul` degli ultimi boss o `atkGrowth`.
- Le fughe/pietà non sono simulate.
- I fine-gioco (arene 28–30) hanno pochi campioni nelle run reali: ricontrolla con `--immortal` dopo ogni modifica.
- Il bonus danni "a ogni colpo" resta il fattore che favorisce le carte multicolpo: se la meta diventa solo multicolpo, riduci `bonus.dmg` degli equipaggiamenti tardivi.
