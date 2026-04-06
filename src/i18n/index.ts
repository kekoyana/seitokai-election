// i18n core module
import { jaStrings } from './ja';
import { enStrings } from './en';
import { jaData, type DataCategory } from './ja-data';
import { enData } from './en-data';

export type Lang = 'ja' | 'en';

const STORAGE_KEY = 'lang';

let currentLang: Lang = (localStorage.getItem(STORAGE_KEY) as Lang) ?? 'ja';
const listeners: Array<() => void> = [];

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang): void {
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  for (const fn of listeners) fn();
}

export function onLangChange(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

const dictMap: Record<Lang, Record<string, string>> = {
  ja: jaStrings,
  en: enStrings,
};

/** UI文字列を取得。{{param}} 形式の補間に対応。 */
export function t(key: string, params?: Record<string, string | number>): string {
  const dict = dictMap[currentLang];
  let text = dict[key] ?? jaStrings[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{{${k}}}`, String(v));
    }
  }
  return text;
}

const dataMap: Record<Lang, Record<string, Record<string, string>>> = {
  ja: jaData,
  en: enData,
};

/** データラベルを取得（カテゴリ + キー）。 */
export function label(category: DataCategory, key: string): string {
  const dict = dataMap[currentLang];
  return dict[category]?.[key] ?? jaData[category]?.[key] ?? key;
}
