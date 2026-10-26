// Estrae tutti i testi italiani dell'interfaccia (src/*.ts) e scrive il modello di traduzione data/locales/_template.json.
// Uso: npm run i18n:extract [codice]  → con un codice (es. en) aggiunge a data/locales/<codice>.json le chiavi mancanti (valore vuoto = ancora da tradurre).
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import ts from 'typescript';
const BLOCK = /<\/?(div|p|button|h[1-6]|li|ul|ol|label|section|table|thead|tbody|tr|td|th|select|option|textarea|input|svg|g|path|rect|circle|ellipse|text)\b[^>]*>/gi;
const keys = new Map();
const keep = (s) => { s = s.replace(/<br\s*\/?>/gi, '<br>').replace(/\s+/g, ' ').trim(); { const m = new Map(); s = s.replace(/\{(\d+)\}/g, (_, n) => `{${m.has(n) ? m.get(n) : (m.set(n, m.size), m.size - 1)}}`); } const plain = s.replace(/<[^>]*>/g, '').replace(/\{\d+\}/g, '').replace(/&[a-z#0-9]+;/gi, ''); if (!/[A-Za-zÀ-ÿ]{2}/.test(plain) && !(/\{\d+\}/.test(s) && /[^\x00-\x7F]/.test(plain) && plain.trim().length <= 4)) return; if (!/\s/.test(plain.trim()) && (/[.,_/\\\[\]=:]/.test(plain) || /^[a-z]/.test(plain))) return; if (/=>|;\s*$|\bfunction\b|\bconst\b|data:image|^\s*[.#]?[a-z-]+\s*[:{]/.test(s)) return; if (/^(aria-|data-|button\[|cd |mvimg|path\(|translate|slotov|type=|M\{\d+\}|#!)|\bdata-[a-z]+=/.test(s)) return; if (/^--|^[.#\[]|^\{\d+\}$|^https?:|\.(png|json|js)$/.test(s)) return; keys.set(s, ''); };
function literal(text) {
  for (const m of text.matchAll(/\b(?:title|placeholder|aria-label|alt)="([^"]*)"/g)) keep(m[1]);
  const noAttr = text.replace(/(<[a-z][^>]*?>)/gi, t => t.replace(/\b(title|placeholder|aria-label|alt)="[^"]*"/g, '').replace(/\s+/g, ' '));
  for (const part of noAttr.split(BLOCK)) { if (part) keep(part.replace(/^(?:button|div|p|h[1-6]|li|ul|ol|label|section|table|tr|td|th|select|option|textarea|input|svg|g|path|rect|circle|ellipse|text)$/i, '')); }
}
function visit(n) {
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) literal(n.text);
  else if (ts.isTemplateExpression(n)) { let i = 0, s = n.head.text; for (const sp of n.templateSpans) { s += `{${i++}}` + sp.literal.text; } literal(s); }
  ts.forEachChild(n, visit);
}
for (const f of readdirSync('src').filter(f => f.endsWith('.ts') && !/^(i18n|locales|gamedata|assets\.generated|audio)\.ts$/.test(f))) visit(ts.createSourceFile(f, readFileSync('src/' + f, 'utf8'), ts.ScriptTarget.Latest, true));
const sorted = Object.fromEntries([...keys.keys()].sort((a, b) => a.localeCompare(b)).map(k => [k, '']));
const code = process.argv[2];
if (code) { const p = `data/locales/${code}.json`, cur = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {}; let add = 0, del = 0; for (const k of Object.keys(sorted)) if (!(k in cur)) { cur[k] = ''; add++; } for (const k of Object.keys(cur)) if (!(k in sorted)) { delete cur[k]; del++; } for (const k of Object.keys(cur)) if (!cur[k] && !/[A-Za-zÀ-ÿ]{2}/.test(k.replace(/<[^>]*>|\{\d+\}/g, ''))) cur[k] = k; writeFileSync(p, JSON.stringify(Object.fromEntries(Object.entries(cur).sort((a, b) => a[0].localeCompare(b[0]))), null, 1)); console.log(`${p}: +${add} nuove, −${del} obsolete; ${Object.values(cur).filter(v => !v).length} da tradurre ( vuote = identiche o ancora da fare)`); }
else { writeFileSync('data/locales/_template.json', JSON.stringify(sorted, null, 1)); console.log(Object.keys(sorted).length + ' chiavi → data/locales/_template.json'); }
