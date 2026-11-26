# Chiavi immagine disponibili

Nome file = chiave (senza estensione). Generato da `npm run assets:list`: rilancialo dopo aver cambiato `data/game.json`.

## Protagonista

| Chiave | Cosa |
|---|---|
| `avatar-a0` | avatar della creazione del personaggio |
| `avatar-a1` | avatar della creazione del personaggio |
| `avatar-a2` | avatar della creazione del personaggio |
| `avatar-a3` | avatar della creazione del personaggio |
| `avatar-a4` | avatar della creazione del personaggio |
| `avatar-a5` | avatar della creazione del personaggio |

## Sagoma del protagonista (schermata Storia, tela consigliata 400x800 px, PNG trasparente)

| Chiave | Cosa |
|---|---|
| `body-a0` | sagoma per l'avatar a0 |
| `body-a1` | sagoma per l'avatar a1 |
| `body-a2` | sagoma per l'avatar a2 |
| `body-a3` | sagoma per l'avatar a3 |
| `body-a4` | sagoma per l'avatar a4 |
| `body-a5` | sagoma per l'avatar a5 |
| `body-default` | sagoma di riserva (usata anche con la foto caricata) |

## Cicatrici sul personaggio (stessa tela 400x800 px; la n-esima compare dopo il n-esimo duello chiuso con meno del 30% di salute, restando per tutta la run)

| Chiave | Cosa |
|---|---|
| `scar-1` | cicatrice n. 1 |
| `scar-2` | cicatrice n. 2 |
| `scar-3` | cicatrice n. 3 |
| `scar-4` | cicatrice n. 4 |
| `scar-5` | cicatrice n. 5 |
| `scar-6` | cicatrice n. 6 |

## Livelli equipaggiamento sul personaggio (stessa tela 400x800 della sagoma, PNG trasparente; sovrapposti nell'ordine di data/game.json)

| Chiave | Cosa |
|---|---|
| `layer-wraps` | Fasce da combattimento |
| `layer-stance` | Guantoni imbottiti |
| `layer-footwork` | Gioco di gambe |
| `layer-plating` | Placcatura sottocutanea |
| `layer-servo` | Braccio servoassistito |
| `layer-blade` | Katana |
| `layer-revolver` | Revolver da duello |
| `layer-titan` | Muscoli titanici |
| `layer-hide` | Pelle di roccia |
| `layer-grimoire` | Grimorio dei sigilli |
| `layer-reactor` | Reattore interno |
| `layer-dash` | Impulso sonico |
| `layer-regen` | Cellule rigeneranti |
| `layer-fruit` | Frutto arcano |
| `layer-rift` | Guanto della frattura |
| `layer-aura` | Aura cataclismica |
| `layer-muaythai` | Muay Thai |
| `layer-capoeira` | Capoeira |
| `layer-knives` | Coltelli da lancio |
| `layer-shotgun` | Fucile a pompa |
| `layer-grenades` | Arsenale esplosivo |
| `layer-parkour` | Parkour |
| `layer-reflex` | Sinapsi accelerate |
| `layer-senses` | Sensi sovrumani |
| `layer-gravboots` | Stivali antigravità |
| `layer-stand` | Stand spettrale |
| `layer-oath` | Giuramento vincolante |
| `layer-aegis` | Egida divina |
| `layer-thunder` | Martello del tuono |
| `layer-phoenix` | Fiamma della fenice |

## Nemici di isola (immagine di riserva per tutti i nemici dell'isola, e icona sulla mappa)

| Chiave | Cosa |
|---|---|
| `foe-boxing` | Fighting Arena |
| `foe-battlefield` | Campo di battaglia |
| `foe-desert` | Deserto |
| `foe-ocean` | Oceano |
| `foe-forest` | Foresta |
| `foe-volcano` | Vulcano |

## Singoli nemici (hanno la precedenza su `foe-<isola>`)

| Chiave | Cosa |
|---|---|
| `enemy-boxing-1` | Sparring partner (Fighting Arena) |
| `enemy-boxing-2` | Pugile di strada (Fighting Arena) |
| `enemy-boxing-3` | Campione regionale (Fighting Arena) |
| `enemy-boxing-4` | Peso massimo (Fighting Arena) |
| `enemy-boxing-5` | Leggenda del ring (Fighting Arena) |
| `enemy-battlefield-1` | Recluta cibernetica (Campo di battaglia) |
| `enemy-battlefield-2` | Cecchino (Campo di battaglia) |
| `enemy-battlefield-3` | Soldato in esoscheletro (Campo di battaglia) |
| `enemy-battlefield-4` | Mech da guerra (Campo di battaglia) |
| `enemy-battlefield-5` | Generale corazzato (Campo di battaglia) |
| `enemy-desert-1` | Predone (Deserto) |
| `enemy-desert-2` | Scorpione gigante (Deserto) |
| `enemy-desert-3` | Mummia guerriera (Deserto) |
| `enemy-desert-4` | Colosso di sabbia (Deserto) |
| `enemy-desert-5` | Faraone solare (Deserto) |
| `enemy-ocean-1` | Squalo corazzato (Oceano) |
| `enemy-ocean-2` | Sirena sonica (Oceano) |
| `enemy-ocean-3` | Pirata dell'energia (Oceano) |
| `enemy-ocean-4` | Kraken (Oceano) |
| `enemy-ocean-5` | Leviatano (Oceano) |
| `enemy-forest-1` | Lupo mutante (Foresta) |
| `enemy-forest-2` | Spirito della foresta (Foresta) |
| `enemy-forest-3` | Treant antico (Foresta) |
| `enemy-forest-4` | Cacciatore del frutto (Foresta) |
| `enemy-forest-5` | Albero del mondo (Foresta) |
| `enemy-volcano-1` | Salamandra celeste (Vulcano) |
| `enemy-volcano-2` | Golem di lava (Vulcano) |
| `enemy-volcano-3` | Demone ardente (Vulcano) |
| `enemy-volcano-4` | Drago cataclismico (Vulcano) |
| `enemy-volcano-5` | Titano del magma (Vulcano) |

## Equipaggiamenti

| Chiave | Cosa |
|---|---|
| `eq-wraps` | Fasce da combattimento |
| `eq-stance` | Guantoni imbottiti |
| `eq-footwork` | Gioco di gambe |
| `eq-plating` | Placcatura sottocutanea |
| `eq-servo` | Braccio servoassistito |
| `eq-blade` | Katana |
| `eq-revolver` | Revolver da duello |
| `eq-titan` | Muscoli titanici |
| `eq-hide` | Pelle di roccia |
| `eq-grimoire` | Grimorio dei sigilli |
| `eq-reactor` | Reattore interno |
| `eq-dash` | Impulso sonico |
| `eq-regen` | Cellule rigeneranti |
| `eq-fruit` | Frutto arcano |
| `eq-rift` | Guanto della frattura |
| `eq-aura` | Aura cataclismica |
| `eq-muaythai` | Muay Thai |
| `eq-capoeira` | Capoeira |
| `eq-knives` | Coltelli da lancio |
| `eq-shotgun` | Fucile a pompa |
| `eq-grenades` | Arsenale esplosivo |
| `eq-parkour` | Parkour |
| `eq-reflex` | Sinapsi accelerate |
| `eq-senses` | Sensi sovrumani |
| `eq-gravboots` | Stivali antigravità |
| `eq-stand` | Stand spettrale |
| `eq-oath` | Giuramento vincolante |
| `eq-aegis` | Egida divina |
| `eq-thunder` | Martello del tuono |
| `eq-phoenix` | Fiamma della fenice |

## Singole carte mossa (hanno la precedenza sull'icona dell'equipaggiamento)

| Chiave | Cosa |
|---|---|
| `card-jab` | Jab (base) |
| `card-guard` | Guardia (base) |
| `card-focus` | Clinch (base) |
| `card-kick` | Calcio frontale (base) |
| `card-roundkick` | Calcio circolare (base) |
| `card-dodge` | Schivata (base) |
| `card-grab` | Presa (base) |
| `card-throw` | Proiezione (base) |
| `card-lock` | Leva articolare (base) |
| `card-wraps_0` | Gancio (Fasce da combattimento) |
| `card-wraps_1` | Flicker jab (Fasce da combattimento) |
| `card-wraps_2` | Cross (Fasce da combattimento) |
| `card-wraps_a0` | Overhand (Fasce da combattimento) |
| `card-wraps_a1` | Adrenalina (Fasce da combattimento) |
| `card-wraps_a2` | Dempsey Roll (Fasce da combattimento) |
| `card-wraps_a3` | Uppercut (Fasce da combattimento) |
| `card-stance_0` | Parata alta (Guantoni imbottiti) |
| `card-stance_1` | Parata bassa (Guantoni imbottiti) |
| `card-stance_2` | Contrattacco (Guantoni imbottiti) |
| `card-stance_a0` | Peek-a-boo (Guantoni imbottiti) |
| `card-stance_a1` | Flow (Guantoni imbottiti) |
| `card-stance_a2` | Scudo d'assalto (Guantoni imbottiti) |
| `card-stance_a3` | Guardia dinamica (Guantoni imbottiti) |
| `card-stance_a4` | Guardia di pietra (Guantoni imbottiti) |
| `card-footwork_0` | Passo laterale (Gioco di gambe) |
| `card-footwork_1` | Gazelle punch (Gioco di gambe) |
| `card-footwork_2` | Serie veloce (Gioco di gambe) |
| `card-footwork_a0` | Combinazione perfetta (Gioco di gambe) |
| `card-footwork_a1` | Ritirata strategica (Gioco di gambe) |
| `card-footwork_a2` | Riscaldamento (Gioco di gambe) |
| `card-footwork_a3` | Cambio di ritmo (Gioco di gambe) |
| `card-plating_0` | Indurimento (Placcatura sottocutanea) |
| `card-plating_1` | Riposo accellerato (Placcatura sottocutanea) |
| `card-plating_2` | Scrollata (Placcatura sottocutanea) |
| `card-plating_a0` | Muro di ferro (Placcatura sottocutanea) |
| `card-plating_a1` | Barriera reattiva (Placcatura sottocutanea) |
| `card-servo_0` | Pistone (Braccio servoassistito) |
| `card-servo_1` | Overclock (Braccio servoassistito) |
| `card-servo_2` | Pugno a rotaia (Braccio servoassistito) |
| `card-servo_a0` | Pressa idraulica (Braccio servoassistito) |
| `card-servo_a1` | Momentum (Braccio servoassistito) |
| `card-blade_0` | Fendente (Katana) |
| `card-blade_1` | Riposta (Katana) |
| `card-blade_2` | Raffica di tagli (Katana) |
| `card-blade_a0` | Recisione (Katana) |
| `card-blade_a1` | Punti deboli (Katana) |
| `card-blade_a2` | Danza delle lame (Katana) |
| `card-blade_a3` | Parata dentata (Katana) |
| `card-revolver_0` | Colpo secco (Revolver da duello) |
| `card-revolver_1` | Raffica (Revolver da duello) |
| `card-revolver_2` | Copertura (Revolver da duello) |
| `card-revolver_a0` | Sparatoria (Revolver da duello) |
| `card-revolver_a1` | Torretta (Revolver da duello) |
| `card-revolver_a2` | Bossoli a terra (Revolver da duello) |
| `card-titan_0` | Pugno devastante (Muscoli titanici) |
| `card-titan_1` | Onda d'urto (Muscoli titanici) |
| `card-titan_2` | Presa schiacciante (Muscoli titanici) |
| `card-titan_a0` | Terremoto (Muscoli titanici) |
| `card-titan_a1` | Frantumazione (Muscoli titanici) |
| `card-titan_a2` | Valanga di pugni (Muscoli titanici) |
| `card-hide_0` | Indurimento (Pelle di roccia) |
| `card-hide_1` | Resistenza (Pelle di roccia) |
| `card-hide_2` | Contrattacco brutale (Pelle di roccia) |
| `card-hide_a0` | Corazza vivente (Pelle di roccia) |
| `card-hide_a1` | Pelle di roccia (Pelle di roccia) |
| `card-hide_a2` | Corazza spinata (Pelle di roccia) |
| `card-grimoire_0` | Dardo arcano (Grimorio dei sigilli) |
| `card-grimoire_1` | Scudo di rune (Grimorio dei sigilli) |
| `card-grimoire_2` | Studio (Grimorio dei sigilli) |
| `card-grimoire_a0` | Biblioteca viva (Grimorio dei sigilli) |
| `card-grimoire_a1` | Tempesta arcana (Grimorio dei sigilli) |
| `card-grimoire_a2` | Totem di rune (Grimorio dei sigilli) |
| `card-reactor_0` | Impulso (Reattore interno) |
| `card-reactor_1` | Sovraccarico (Reattore interno) |
| `card-reactor_2` | Esplosione (Reattore interno) |
| `card-reactor_a0` | Raggio (Reattore interno) |
| `card-reactor_a1` | Stratega (Reattore interno) |
| `card-reactor_a2` | Condotto d'assorbimento (Reattore interno) |
| `card-dash_0` | Scatto sonico (Impulso sonico) |
| `card-dash_1` | Z sfuggente (Impulso sonico) |
| `card-dash_2` | Controllo del campo (Impulso sonico) |
| `card-dash_a0` | Muro del suono (Impulso sonico) |
| `card-dash_a1` | Scatto di fuga (Impulso sonico) |
| `card-dash_a2` | Clonazione (Impulso sonico) |
| `card-dash_a3` | Reazione a catena (Impulso sonico) |
| `card-regen_0` | Rigenerazione (Cellule rigeneranti) |
| `card-regen_1` | Sensi acuti (Cellule rigeneranti) |
| `card-regen_2` | Morso istintivo (Cellule rigeneranti) |
| `card-regen_a0` | Mutazione (Cellule rigeneranti) |
| `card-regen_a1` | Rigenerazione rapida (Cellule rigeneranti) |
| `card-fruit_0` | Braccio elastico (Frutto arcano) |
| `card-fruit_1` | Forma ferina (Frutto arcano) |
| `card-fruit_2` | Impulso di fuoco (Frutto arcano) |
| `card-fruit_a0` | Risveglio del frutto (Frutto arcano) |
| `card-fruit_a1` | Forma sfuggente (Frutto arcano) |
| `card-fruit_a2` | Duplicazione (Frutto arcano) |
| `card-fruit_a3` | Metamorfosi (Frutto arcano) |
| `card-rift_0` | Frantuma (Guanto della frattura) |
| `card-rift_1` | Distorsione (Guanto della frattura) |
| `card-rift_2` | Squarcio (Guanto della frattura) |
| `card-rift_a0` | Nova (Guanto della frattura) |
| `card-rift_a1` | Strappo dimensionale (Guanto della frattura) |
| `card-rift_a2` | Sovratensione (Guanto della frattura) |
| `card-aura_0` | Esplosione di ki (Aura cataclismica) |
| `card-aura_1` | Aura divina (Aura cataclismica) |
| `card-aura_2` | Colpo cataclismico (Aura cataclismica) |
| `card-aura_a0` | Trasformazione divina (Aura cataclismica) |
| `card-aura_a1` | Esplosione di ki (Aura cataclismica) |
| `card-aura_a2` | Cataclisma (Aura cataclismica) |
| `card-muaythai_0` | Ginocchiata (Muay Thai) |
| `card-muaythai_1` | Gomitata (Muay Thai) |
| `card-muaythai_2` | Calcio basso (Muay Thai) |
| `card-muaythai_a0` | Clinch thailandese (Muay Thai) |
| `card-muaythai_a1` | Gomito volante (Muay Thai) |
| `card-muaythai_a2` | Ginocchiate a raffica (Muay Thai) |
| `card-capoeira_0` | Ginga (Capoeira) |
| `card-capoeira_1` | Rasteira (Capoeira) |
| `card-capoeira_2` | Meia-lua de compasso (Capoeira) |
| `card-capoeira_a0` | Armada (Capoeira) |
| `card-capoeira_a1` | Macaco (Capoeira) |
| `card-capoeira_a2` | Mortal (Capoeira) |
| `card-knives_0` | Lancio rapido (Coltelli da lancio) |
| `card-knives_1` | Pugnalata (Coltelli da lancio) |
| `card-knives_2` | Parata col pugnale (Coltelli da lancio) |
| `card-knives_a0` | Coltelli piantati (Coltelli da lancio) |
| `card-knives_a1` | Colpo alla gola (Coltelli da lancio) |
| `card-knives_a2` | Tutto o niente (Coltelli da lancio) |
| `card-knives_a3` | Lama boomerang (Coltelli da lancio) |
| `card-shotgun_0` | Pallettoni (Fucile a pompa) |
| `card-shotgun_1` | Ricarica a pompa (Fucile a pompa) |
| `card-shotgun_2` | Calcio del fucile (Fucile a pompa) |
| `card-shotgun_a0` | Doppietta (Fucile a pompa) |
| `card-shotgun_a1` | Colpo a bruciapelo (Fucile a pompa) |
| `card-shotgun_a2` | Barricata (Fucile a pompa) |
| `card-grenades_0` | Granata a frammentazione (Arsenale esplosivo) |
| `card-grenades_1` | Fumogeno (Arsenale esplosivo) |
| `card-grenades_2` | Granata stordente (Arsenale esplosivo) |
| `card-grenades_a0` | Mina antiuomo (Arsenale esplosivo) |
| `card-grenades_a1` | Bomba a grappolo (Arsenale esplosivo) |
| `card-grenades_a2` | Carica demolitrice (Arsenale esplosivo) |
| `card-parkour_0` | Salto del muro (Parkour) |
| `card-parkour_1` | Calcio in scivolata (Parkour) |
| `card-parkour_2` | Rimbalzo (Parkour) |
| `card-parkour_a0` | Flusso continuo (Parkour) |
| `card-parkour_a1` | Salto mortale (Parkour) |
| `card-parkour_a2` | Corsa sui tetti (Parkour) |
| `card-reflex_0` | Tempo bullet (Sinapsi accelerate) |
| `card-reflex_1` | Contromossa (Sinapsi accelerate) |
| `card-reflex_2` | Anticipazione (Sinapsi accelerate) |
| `card-reflex_a0` | Riflesso condizionato (Sinapsi accelerate) |
| `card-reflex_a1` | Scarica neurale (Sinapsi accelerate) |
| `card-reflex_a2` | Raffica di riflessi (Sinapsi accelerate) |
| `card-senses_0` | Colpo mirato (Sensi sovrumani) |
| `card-senses_1` | Lettura del campo (Sensi sovrumani) |
| `card-senses_2` | Punto cieco (Sensi sovrumani) |
| `card-senses_a0` | Visione predittiva (Sensi sovrumani) |
| `card-senses_a1` | Udito assoluto (Sensi sovrumani) |
| `card-senses_a2` | Colpo al centro (Sensi sovrumani) |
| `card-gravboots_0` | Calcio a mezz'aria (Stivali antigravità) |
| `card-gravboots_1` | Schivata aerea (Stivali antigravità) |
| `card-gravboots_2` | Picchiata (Stivali antigravità) |
| `card-gravboots_a0` | Tempesta di calci (Stivali antigravità) |
| `card-gravboots_a1` | Salto gravitazionale (Stivali antigravità) |
| `card-stand_0` | Raffica dello Stand (Stand spettrale) |
| `card-stand_1` | Guardia spettrale (Stand spettrale) |
| `card-stand_2` | Pugno a distanza (Stand spettrale) |
| `card-stand_a0` | Raffica infinita (Stand spettrale) |
| `card-stand_a1` | Stand protettivo (Stand spettrale) |
| `card-stand_a2` | Requiem (Stand spettrale) |
| `card-stand_a3` | Assalto autonomo (Stand spettrale) |
| `card-oath_0` | Catena dell'anima (Giuramento vincolante) |
| `card-oath_1` | Voto di ferro (Giuramento vincolante) |
| `card-oath_2` | Vincolo di sangue (Giuramento vincolante) |
| `card-oath_a0` | Contratto d'anima (Giuramento vincolante) |
| `card-oath_a1` | Maledizione (Giuramento vincolante) |
| `card-oath_a2` | Clausola finale (Giuramento vincolante) |
| `card-aegis_0` | Scudo sacro (Egida divina) |
| `card-aegis_1` | Benedizione (Egida divina) |
| `card-aegis_2` | Giudizio riflesso (Egida divina) |
| `card-aegis_a0` | Santuario (Egida divina) |
| `card-aegis_a1` | Pioggia divina (Egida divina) |
| `card-aegis_a2` | Ira dell'Egida (Egida divina) |
| `card-thunder_0` | Folgore (Martello del tuono) |
| `card-thunder_1` | Tuono (Martello del tuono) |
| `card-thunder_2` | Tempesta (Martello del tuono) |
| `card-thunder_a0` | Giudizio del cielo (Martello del tuono) |
| `card-thunder_a1` | Catena di fulmini (Martello del tuono) |
| `card-thunder_a2` | Cielo in tempesta (Martello del tuono) |
| `card-phoenix_0` | Fiamma purificatrice (Fiamma della fenice) |
| `card-phoenix_1` | Ali di cenere (Fiamma della fenice) |
| `card-phoenix_2` | Rogo sacro (Fiamma della fenice) |
| `card-phoenix_a0` | Rinascita (Fiamma della fenice) |
| `card-phoenix_a1` | Piuma ardente (Fiamma della fenice) |
| `card-phoenix_a2` | Supernova della fenice (Fiamma della fenice) |
| `card-phoenix_a3` | Ultima brace (Fiamma della fenice) |

## Carte nemiche

| Chiave | Cosa |
|---|---|
| `enemycard-direct` | Diretto |
| `enemycard-heavy` | Colpo pesante |
| `enemycard-guard` | Parata |
| `enemycard-flurry` | Raffica |
| `enemycard-drain` | Assorbimento |
| `enemycard-rocket` | Razzo |
| `enemycard-shock` | Onda d'urto |
| `enemycard-regen` | Rigenerazione |
| `enemycard-cata` | Colpo cataclismico |
| `enemycard-jab2` | Doppio colpo |
| `enemycard-volley` | Salva |
| `enemycard-counter` | Contrattacco |
| `enemycard-bulwark` | Fortezza |
| `enemycard-mend` | Riparazione |
| `enemycard-bite` | Morso vampirico |
| `enemycard-crush` | Schianto |
| `enemycard-sting` | Pungiglione |

## Stili iniziali

| Chiave | Cosa |
|---|---|
| `style-boxing` | Pugilato |
| `style-taekwondo` | Taekwondo |
| `style-jujitsu` | Jujitsu |

## Tipi di carta (ripiego generico) e mappa

| Chiave | Cosa |
|---|---|
| `kind-atk` | attacco |
| `kind-def` | difesa |
| `kind-utl` | supporto |
| `boat` | barca della mappa |
