# Note per un futuro multiplayer
Il gioco è già predisposto: l'engine è puro e deterministico, i dati sono versionabili e lo stato è serializzabile.

## Strada consigliata (dal più semplice)
1. **PvP asincrono "fantasma"** — il giocatore sfida lo *snapshot* di mazzo/equipaggiamento di un altro, controllato dall'IA. Serve solo un piccolo backend che salva/serve snapshot (Supabase, Firebase o Cloudflare Workers + D1). Nessun tempo reale.
2. **Classifiche e salvataggi in cloud** — account leggeri (Supabase Auth/Firebase) e una tabella di punteggi.
3. **PvP a turni in tempo reale** — il server esegue lo stesso `engine.ts` (è TypeScript puro, gira in Node) come arbitro: i client inviano solo *comandi* (`playCard(uid)`, `endTurn`, `askMercy`), il server li valida e trasmette lo stato. Strumenti: Colyseus, PartyKit o Cloudflare Durable Objects (WebSocket).

## Refactor da fare prima del tempo reale
- Oggi il nemico è l'IA dentro `Combat`. Va astratto un `Side` con mano, energia e campo uguale per entrambi; l'IA diventa un *controller* che produce comandi, e un secondo giocatore è un altro controller.
- Trasformare le funzioni in comandi espliciti `applyCommand(state, cmd)` (anche solo wrapper) così da poter registrare e rigiocare le partite.
- Informazione nascosta: il server invia a ogni giocatore solo la sua mano, non quella dell'avversario.
- Anti-cheat: il server è l'unica fonte di verità (casualità e prezzi lato server). Inserire `dataVersion` in `game.json` per tenere allineati client e server.
- Test di replay: stessa sequenza di comandi + seme = stesso stato finale.
