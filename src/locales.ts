// Registro delle lingue dell'interfaccia (oltre all'italiano, che è la lingua sorgente del codice).
// Per aggiungerne una: crea data/locales/<codice>.json e registrala qui sotto. I testi di gioco (carte, storie…) si traducono invece dall'Editor.
import en from '../data/locales/en.json';
export interface Locale { name: string; ui: Record<string, string> }
export const LOCALES: Record<string, Locale> = {
  en: { name: 'English', ui: en as Record<string, string> },
  // es: { name: 'Español', ui: es as Record<string, string> },
};
