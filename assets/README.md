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
| `hero` | immagine di riserva del protagonista |

Dopo aver aggiunto i file: `npm run build` (o `npm run dev` per ricompilare a ogni modifica).
Le immagini vengono incorporate nel bundle come data URI: tieni file leggeri (meglio < 100 KB ciascuno).
