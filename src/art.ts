// Immagini vettoriali incorporate (data URI): sostituiscono le emoji. Sostituibili con asset definitivi.
import { ASSETS } from './assets.generated';
const mk = (b: string) => `<img class="ic" alt="" draggable="false" src="data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${b}</svg>`)}">`;
const kind = {
  atk: mk('<circle cx="32" cy="32" r="22" fill="#ff7a45"/><path d="M32 4l7 16 17-6-9 15 16 7-17 2 3 17-15-11-15 11 3-17-17-2 16-7-9-15 17 6z" fill="#ffd77a"/><circle cx="32" cy="32" r="9" fill="#fff"/>'),
  def: mk('<path d="M32 5l21 8v17c0 14-9 24-21 29C20 54 11 44 11 30V13z" fill="#5aa9ff" stroke="#e6f3ff" stroke-width="3"/><path d="M32 11v42c-9-4-15-12-15-23V16z" fill="#2a5db0"/>'),
  utl: mk('<path d="M32 4l8 20 21 1-17 13 6 21-18-12-18 12 6-21L3 25l21-1z" fill="#5be3a6" stroke="#eafff5" stroke-width="2"/>'),
};
const av = (skin: string, hair: string, suit: string, glove: string) => mk(`<circle cx="32" cy="18" r="10" fill="${skin}"/><path d="M20 19c2-11 22-11 24 0-6-4-18-4-24 0z" fill="${hair}"/><path d="M14 60c0-17 8-27 18-27s18 10 18 27z" fill="${suit}"/><rect x="9" y="36" width="12" height="13" rx="6" fill="${glove}"/><rect x="43" y="36" width="12" height="13" rx="6" fill="${glove}"/>`);
export const ART = {
  avatar: { a0: av('#f2c9a0', '#2a1f3a', '#e8e8f0', '#d33'), a1: av('#d9a57a', '#111', '#3a6ad9', '#ffd77a'), a2: av('#8d5a3a', '#111', '#2a9a5a', '#fff'), a3: av('#f7d9bf', '#d94a2a', '#222', '#6be6ff'), a4: av('#c68b5e', '#5a3a1a', '#8a2fc9', '#ffd77a'), a5: av('#5a3a28', '#e8e8e8', '#d4552d', '#222') } as Record<string, string>,
  kind,
  hero: mk('<circle cx="32" cy="18" r="10" fill="#f2c9a0"/><path d="M14 60c0-17 8-27 18-27s18 10 18 27z" fill="#e8e8f0"/><path d="M20 19c2-11 22-11 24 0-6-4-18-4-24 0z" fill="#2a1f3a"/><rect x="9" y="36" width="12" height="13" rx="6" fill="#d33"/><rect x="43" y="36" width="12" height="13" rx="6" fill="#d33"/>'),
  eq: {
    wraps: mk('<rect x="12" y="20" width="32" height="26" rx="8" fill="#e8d9b0"/><rect x="40" y="24" width="13" height="18" rx="6" fill="#e8d9b0"/><path d="M17 28h22M17 34h22M17 40h22" stroke="#c33" stroke-width="3"/>'),
    plating: mk('<rect x="11" y="13" width="42" height="38" rx="9" fill="#9aa7b8" stroke="#dfe7f2" stroke-width="3"/><rect x="25" y="23" width="14" height="18" rx="3" fill="#657489"/><circle cx="19" cy="21" r="2.5"/><circle cx="45" cy="21" r="2.5"/><circle cx="19" cy="43" r="2.5"/><circle cx="45" cy="43" r="2.5"/>'),
    servo: mk('<rect x="6" y="26" width="30" height="12" rx="5" fill="#8a96a8"/><circle cx="40" cy="32" r="11" fill="#5be3a6" stroke="#1c7a54" stroke-width="3"/><path d="M49 22l10-6v32l-10-6z" fill="#cfd8e6"/><circle cx="13" cy="32" r="3" fill="#333"/>'),
    blade: mk('<path d="M8 56L46 6l8 6-36 46z" fill="#dfe9f5" stroke="#8fa3bb" stroke-width="2"/><rect x="4" y="46" width="18" height="7" rx="3" transform="rotate(-50 13 50)" fill="#c9892a"/>'),
    reactor: mk('<circle cx="32" cy="32" r="22" fill="#1a1230" stroke="#6be6ff" stroke-width="4"/><circle cx="32" cy="32" r="11" fill="#6be6ff"/><path d="M32 4v9M32 51v9M4 32h9M51 32h9" stroke="#6be6ff" stroke-width="4"/>'),
    rift: mk('<ellipse cx="32" cy="32" rx="25" ry="14" fill="none" stroke="#c58bff" stroke-width="5" transform="rotate(-30 32 32)"/><ellipse cx="32" cy="32" rx="12" ry="6" fill="#7b3fe0" transform="rotate(-30 32 32)"/><circle cx="32" cy="32" r="4" fill="#fff"/>'),
  } as Record<string, string>,
  foe: {
    Strada: mk('<circle cx="32" cy="18" r="10" fill="#d9a77c"/><path d="M14 60c0-17 8-27 18-27s18 10 18 27z" fill="#4a4a5a"/><rect x="9" y="36" width="12" height="13" rx="6" fill="#333"/><rect x="43" y="36" width="12" height="13" rx="6" fill="#333"/>'),
    Professionista: mk('<circle cx="32" cy="18" r="10" fill="#d9a77c"/><rect x="25" y="14" width="14" height="5" rx="2" fill="#6be6ff"/><path d="M14 60c0-17 8-27 18-27s18 10 18 27z" fill="#2a4f9a"/><rect x="9" y="36" width="12" height="13" rx="6" fill="#8a96a8"/><rect x="43" y="36" width="12" height="13" rx="6" fill="#8a96a8"/>'),
    Sovrumano: mk('<path d="M17 12l7 9M47 12l-7 9" stroke="#eee" stroke-width="5"/><circle cx="32" cy="24" r="12" fill="#c98a6a"/><path d="M6 60c0-19 11-29 26-29s26 10 26 29z" fill="#7a2f3a"/>'),
    Mitico: mk('<path d="M6 42c4-19 21-30 42-27l10 8-13 4 7 8-15 2 7 11-26-2z" fill="#3fb585"/><circle cx="40" cy="25" r="3.5" fill="#ffd77a"/>'),
    Divino: mk('<circle cx="32" cy="32" r="14" fill="#ffd77a"/><path d="M32 3v10M32 51v10M3 32h10M51 32h10M11 11l7 7M46 46l7 7M53 11l-7 7M18 46l-7 7" stroke="#ffd77a" stroke-width="4"/>'),
    Cosmico: mk('<circle cx="32" cy="32" r="25" fill="#150b33"/><ellipse cx="32" cy="32" rx="19" ry="8" fill="none" stroke="#c58bff" stroke-width="3" transform="rotate(30 32 32)"/><circle cx="21" cy="21" r="2" fill="#fff"/><circle cx="45" cy="42" r="2" fill="#fff"/><circle cx="32" cy="32" r="5" fill="#6be6ff"/>'),
  } as Record<string, string>,
  boat: mk('<path d="M6 38h52l-9 14H15z" fill="#8a5a2b" stroke="#4a2f14" stroke-width="2"/><path d="M32 6v32" stroke="#4a2f14" stroke-width="3"/><path d="M35 8l18 24H35z" fill="#fff" stroke="#ddd"/>'),
  region: {
    boxing: mk('<rect x="12" y="12" width="32" height="28" rx="13" fill="#d33"/><rect x="40" y="22" width="14" height="14" rx="6" fill="#d33"/><rect x="18" y="40" width="22" height="14" rx="4" fill="#eee"/><path d="M20 24h18" stroke="#fff" stroke-width="3"/>'),
    battlefield: mk('<path d="M10 38c0-15 9-26 22-26s22 11 22 26z" fill="#6b7a3a" stroke="#3e4a1f" stroke-width="2"/><rect x="8" y="38" width="48" height="9" rx="3" fill="#4a5528"/><rect x="24" y="27" width="16" height="6" rx="2" fill="#222"/><path d="M32 12V5" stroke="#4a5528" stroke-width="3"/>'),
    forest: mk('<circle cx="32" cy="22" r="16" fill="#2f8f4f"/><rect x="26" y="34" width="12" height="24" rx="3" fill="#6b4a2a"/><circle cx="26" cy="22" r="3" fill="#ffd77a"/><circle cx="38" cy="22" r="3" fill="#ffd77a"/>'),
    ocean: mk('<ellipse cx="32" cy="24" rx="16" ry="14" fill="#2b9ec9"/><path d="M16 34c-6 8-2 16 4 18M26 38c-2 8 0 14 4 16M38 38c2 8 0 14-4 16M48 34c6 8 2 16-4 18" stroke="#2b9ec9" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="26" cy="22" r="3" fill="#fff"/><circle cx="38" cy="22" r="3" fill="#fff"/>'),
    desert: mk('<ellipse cx="32" cy="38" rx="18" ry="12" fill="#d9a24a"/><path d="M48 34c8-4 10-14 4-22" stroke="#d9a24a" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="26" cy="34" r="3" fill="#2a1600"/><path d="M12 30l-6-6M12 44l-6 6M52 44l6 6" stroke="#a8742a" stroke-width="4" stroke-linecap="round"/>'),
    volcano: mk('<path d="M32 6l8 16 12-6-4 18 8 10H12l8-10-4-18 12 6z" fill="#ff6a3d"/><circle cx="26" cy="34" r="3" fill="#ffe08a"/><circle cx="38" cy="34" r="3" fill="#ffe08a"/>'),
  } as Record<string, string>,
  emoji: { '👊': kind.atk, '💢': kind.atk, '🛡️': kind.def, '🌪️': kind.atk, '🩸': kind.utl } as Record<string, string>,
};

// Icone di ripiego per tipo di equipaggiamento (usate se non esiste un'immagine specifica per quell'equipaggiamento).
(ART as { eqKind?: Record<string, string> }).eqKind = {
  gear: mk('<circle cx="32" cy="32" r="12" fill="#c9892a"/><path d="M32 6l4 8h-8zM32 58l-4-8h8zM6 32l8-4v8zM58 32l-8 4v-8zM14 14l8 2-6 6zM50 50l-8-2 6-6zM50 14l-2 8-6-6zM14 50l2-8 6 6z" fill="#e0a838"/><circle cx="32" cy="32" r="5" fill="#2a1a00"/>'),
  implant: mk('<rect x="14" y="14" width="36" height="36" rx="6" fill="#1a2a3a" stroke="#5be3a6" stroke-width="3"/><path d="M22 6v8M32 6v8M42 6v8M22 50v8M32 50v8M42 50v8M6 22h8M6 32h8M6 42h8M50 22h8M50 32h8M50 42h8" stroke="#8a96a8" stroke-width="3"/><rect x="24" y="24" width="16" height="16" rx="3" fill="#5be3a6"/>'),
  body: mk('<path d="M12 46c0-14 8-26 22-26 6 0 10 4 10 10 0 8-6 8-6 14v6H12z" fill="#e8b48a" stroke="#a8743a" stroke-width="2"/><circle cx="36" cy="28" r="6" fill="#d9a077"/>'),
  style: mk('<rect x="10" y="12" width="44" height="40" rx="6" fill="#f0e3c0" stroke="#a8743a" stroke-width="3"/><path d="M18 24h28M18 32h28M18 40h18" stroke="#8a5a2b" stroke-width="3"/>'),
  arcane: mk('<circle cx="32" cy="32" r="18" fill="#7b3fe0"/><circle cx="32" cy="32" r="9" fill="#e6c6ff"/><path d="M32 4v10M32 50v10M4 32h10M50 32h10" stroke="#c58bff" stroke-width="4"/>'),
};
// Immagini personalizzate: se in assets/ esiste un file con la chiave giusta, sostituisce l'illustrazione provvisoria (vedi assets/README.md).
const custom = (k: string) => ASSETS[k] ? `<img class="ic" alt="" draggable="false" src="${ASSETS[k]}">` : undefined;
const ov = (o: Record<string, string>, prefix: string) => { for (const k of Object.keys(o)) o[k] = custom(prefix + k) ?? o[k]; };
ov(ART.avatar, 'avatar-'); ov(ART.eq, 'eq-'); ov(ART.kind, 'kind-'); ov(ART.region, 'foe-'); ART.hero = custom('hero') ?? ART.hero; ART.boat = custom('boat') ?? ART.boat;
/** Icona di un equipaggiamento: immagine personalizzata `eq-<id>`, altrimenti quella provvisoria, altrimenti quella del suo tipo. */
export const eqIcon = (id: string, kind?: string): string => custom('eq-' + id) ?? ART.eq[id] ?? (ART as unknown as { eqKind: Record<string, string> }).eqKind[kind ?? 'gear'] ?? (ART as unknown as { eqKind: Record<string, string> }).eqKind.gear;
