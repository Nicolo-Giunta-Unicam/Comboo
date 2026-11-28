# Immagini personalizzate

Metti qui le tue immagini (PNG, JPG, WEBP, GIF o SVG): al build sostituiscono le illustrazioni provvisorie.
Il **nome del file** (senza estensione) è la chiave. Quelle che non fornisci restano le illustrazioni di default.
Consigliato: immagini quadrate (es. 256×256), sfondo trasparente per personaggi e oggetti.

| Chiave | Dove compare |
|---|---|
| `avatar-a0` … `avatar-a5` | avatar proposti nella creazione del personaggio (e il protagonista in gioco) |
| `foe-boxing`, `foe-battlefield`, `foe-desert`, `foe-ocean`, `foe-forest`, `foe-volcano` | nemici di ogni isola e icona dell'isola sulla mappa |
| `eq-<id>` (es. `eq-wraps`, `eq-aura`, `eq-fruit`) | carta/icona dell'equipaggiamento. Gli id sono in `data/game.json` |
| `kind-atk`, `kind-def`, `kind-utl` | immagine delle carte base e delle mosse (attacco / difesa / supporto) |
| `boat` | barca della mappa |
| `body-a0` … `body-a5`, `body-default` | **sagoma del protagonista** nella schermata Storia (una per avatar; `body-default` è il ripiego, usato anche con la foto caricata) |
| `layer-<id>` (es. `layer-wraps`, `layer-servo`) | **livello dell'equipaggiamento sul personaggio**: compare sulla sagoma quando l'equipaggiamento è installato (diverso da `eq-<id>`, che è l'immagine della carta) |
| `scar-1` … `scar-6` | **cicatrici** sul personaggio: la n-esima compare quando un duello (vittoria o pietà) finisce con meno del 30% di salute, e resta anche dopo le cure. Stanno sopra la sagoma e sotto gli equipaggiamenti |

Sagoma e livelli devono avere **la stessa tela** (consigliato 400×800 px, PNG trasparente): si sovrappongono 1:1, prima la sagoma e poi i livelli nell'ordine in cui gli equipaggiamenti compaiono in `data/game.json`. Un equipaggiamento senza `layer-<id>` non mostra nulla sul corpo (finché manca compare una piccola icona sotto la sagoma).

Dopo aver aggiunto i file: `npm run build` (o `npm run dev` per ricompilare a ogni modifica).
Le immagini vengono incorporate nel bundle come data URI: tieni file leggeri (meglio < 100 KB ciascuno).

## Immagini per singolo nemico e per singola carta
La lista **completa e aggiornata** di tutte le chiavi è in `assets/KEYS.md` (si rigenera con `npm run assets:list` dopo aver cambiato `data/game.json`).

| Chiave | Cosa | Ripiego se manca |
|---|---|---|
| `enemy-<id>` (es. `enemy-boxing-1`) | ritratto di quel nemico (id nel JSON, 5 per isola) | `foe-<isola>` |
| `card-<idMossa>` (es. `card-jab`, `card-wraps_0`) | immagine di quella carta mossa | icona dell'equipaggiamento, poi `kind-*` |
| `enemycard-<id>` (es. `enemycard-heavy`) | carte giocate dai nemici | `kind-*` |
| `style-<id>` (`style-boxing`, `style-taekwondo`, `style-jujitsu`) | carta dello stile iniziale (slot machine) | emoji |

## Sfondi per arena (menu e duelli)
Ogni arena può avere **due immagini di sfondo**, da mettere nella cartella `assets/backgrounds/` (non direttamente in `assets/`):

| File (qualsiasi estensione png, jpg, webp, gif, svg) | Dove compare |
|---|---|
| `menu-<arena>` (es. `menu-ocean.jpg`) | store, storia, mazzo e abilità di quell'arena |
| `duel-<arena>` (es. `duel-ocean.jpg`) | duelli di quell'arena |

`<arena>` è uno tra `boxing`, `battlefield`, `desert`, `ocean`, `forest`, `volcano` (gli id in `data/game.json`).
- Lo sfondo sta **sotto** particelle, polvere, sfere di luce e tutti gli altri effetti.
- **Se un file manca non cambia nulla**: per quella schermata resta lo sfondo di sempre. Menu principale, creazione del personaggio e mappa non hanno uno sfondo di arena.
- A differenza delle altre immagini, gli sfondi **non** finiscono dentro `game.js`: restano file separati (in `dist/backgrounds/`) caricati solo quando servono, quindi possono essere più grandi. Consigliato: 1920×1080 (16:9), JPG o WEBP, meglio sotto 400 KB. L'immagine riempie lo schermo (si ritaglia ai bordi), quindi tieni il soggetto al centro.
- Quando c'è uno sfondo, i pannelli grandi (campo di battaglia, libro della storia, store) diventano un po' trasparenti per lasciarlo intravedere, e l'immagine è scurita al 50% (nero semitrasparente sopra l'immagine) per tenere leggibile l'interfaccia. Si regola in `index.html` con `--bgdim` (scurimento, 0-1; ora 0.5), `--bgpanel` (opacità del campo) e `--bgpanel2` (opacità degli altri pannelli).
- Dopo aver aggiunto i file basta committare: la pubblicazione su GitHub Pages esegue il build che li copia. In locale: `npm run build` (o `npm run dev`).
