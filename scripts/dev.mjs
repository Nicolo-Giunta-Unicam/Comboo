// Server di sviluppo: ricompila a ogni modifica e serve http://localhost:5173 (ricarica la pagina per vedere i cambi).
import * as esbuild from 'esbuild';
const ctx = await esbuild.context({ entryPoints: ['src/main.ts'], bundle: true, outfile: 'dist/game.js', sourcemap: true, target: 'es2020' });
await ctx.watch(); const { port } = await ctx.serve({ servedir: '.', port: 5173 }); console.log(`http://localhost:${port}`);
