// Elenca tutte le chiavi immagine valide (da data/game.json) e scrive assets/KEYS.md.  Uso: npm run assets:list
import { readFileSync, writeFileSync } from 'node:fs';
const d = JSON.parse(readFileSync('data/game.json', 'utf8'));
const L = ['# Chiavi immagine disponibili', '', 'Nome file = chiave (senza estensione). Generato da `npm run assets:list`: rilancialo dopo aver cambiato `data/game.json`.', ''];
const sec = (t, rows) => { L.push(`## ${t}`, '', '| Chiave | Cosa |', '|---|---|', ...rows.map(r => `| \`${r[0]}\` | ${r[1]} |`), ''); };
sec('Protagonista', Array.from({ length: 6 }, (_, i) => [`avatar-a${i}`, 'avatar della creazione del personaggio']));
sec('Sagoma del protagonista (schermata Storia, tela consigliata 400x800 px, PNG trasparente)', [...Array.from({ length: 6 }, (_, i) => [`body-a${i}`, `sagoma per l'avatar a${i}`]), ['body-default', 'sagoma di riserva (usata anche con la foto caricata)']]);
sec('Livelli equipaggiamento sul personaggio (stessa tela 400x800 della sagoma, PNG trasparente; sovrapposti nell\'ordine di data/game.json)', d.equipment.map(e => [`layer-${e.id}`, e.name]));
sec('Nemici di isola (immagine di riserva per tutti i nemici dell\'isola, e icona sulla mappa)', d.regions.map(r => [`foe-${r.id}`, r.name]));
sec('Singoli nemici (hanno la precedenza su `foe-<isola>`)', d.regions.flatMap(r => r.enemies.map(e => [`enemy-${e.id}`, `${e.name} (${r.name})`])));
sec('Equipaggiamenti', d.equipment.map(e => [`eq-${e.id}`, e.name]));
sec('Singole carte mossa (hanno la precedenza sull\'icona dell\'equipaggiamento)', [...d.baseMoves.map(m => [`card-${m.id}`, `${m.name} (base)`]), ...d.equipment.flatMap(e => [...e.moves, ...e.advanced].map(m => [`card-${m.id}`, `${m.name} (${e.name})`]))]);
sec('Carte nemiche', d.enemyMoves.map(m => [`enemycard-${m.id}`, m.name]));
sec('Stili iniziali', d.styles.map(s => [`style-${s.id}`, s.name]));
sec('Tipi di carta (ripiego generico) e mappa', [['kind-atk', 'attacco'], ['kind-def', 'difesa'], ['kind-utl', 'supporto'], ['boat', 'barca della mappa']]);
writeFileSync('assets/KEYS.md', L.join('\n')); console.log(L.join('\n'));
