import { messages, patterns, japanese, japanesePatterns } from './messages.js';
export const LANGUAGE_KEY = 'fly-lab.language';
export function resolveLanguage(preference, systemLanguage = 'en') {
  if (preference === 'ja' || preference === 'en') return preference;
  return /^ja(?:-|$)/i.test(systemLanguage) ? 'ja' : 'en';
}
let preference = 'system';
try {
  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (['system', 'en', 'ja'].includes(stored)) preference = stored;
} catch {}
export function getPreference() {
  return preference;
}
export function getLanguage() {
  return resolveLanguage(preference, globalThis.navigator?.language);
}
export function setPreference(value) {
  preference = ['system', 'en', 'ja'].includes(value) ? value : 'system';
  try {
    localStorage.setItem(LANGUAGE_KEY, preference);
  } catch {}
}
const normalize = (value) => value.replace(/\s+/g, ' ').trim();
const compile = (entries) =>
  entries.map(([source, english]) => {
    const names = [];
    const parts = source.split(/(\{\w+\})/g).map((part) => {
      if (/^\{\w+\}$/.test(part)) {
        names.push(part.slice(1, -1));
        return '(.+?)';
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });
    return { regexp: new RegExp('^' + parts.join('') + '$'), names, english };
  });
const compiled = compile(patterns);
const compiledJapanese = compile(japanesePatterns);
export function translate(value, language = getLanguage()) {
  const source = normalize(String(value));
  const dictionary = language === 'ja' ? japanese : messages;
  if (Object.hasOwn(dictionary, source)) return dictionary[source];
  for (const { regexp, names, english } of language === 'ja' ? compiledJapanese : compiled) {
    const match = source.match(regexp);
    if (match)
      return english.replace(/\{(\w+)\}/g, (_, name) => translate(match[names.indexOf(name) + 1], language));
  }
  return source;
}
// Translate presentation only. Keep model events and hashes untouched; retain each
// source node/attribute so changing language is reversible without resetting the run.
const sources = new WeakMap();
function localize(owner, key, current, write) {
  let records = sources.get(owner);
  if (!records) {
    records = new Map();
    sources.set(owner, records);
  }
  const record = records.get(key);
  const source = record && current === record.output ? record.source : current;
  const core = translate(source);
  const output = source.replace(/\S[\s\S]*\S|\S/, core);
  if (current !== output) write(output);
  records.set(key, { source, output });
}
export function translateDOM(root = document.body) {
  document.documentElement.lang = getLanguage();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement.closest('script,style,code,[data-no-i18n]') || !node.textContent.trim()) continue;
    const target = node;
    localize(target, 'text', target.textContent, (value) => {
      target.textContent = value;
    });
  }
  for (const el of [root, ...root.querySelectorAll('[aria-label],[title]')]) {
    if (el.closest('[data-no-i18n]')) continue;
    for (const attr of ['aria-label', 'title'])
      if (el.hasAttribute(attr))
        localize(el, attr, el.getAttribute(attr), (value) => el.setAttribute(attr, value));
  }
  const meta = document.querySelector('meta[name="description"]');
  if (meta)
    localize(meta, 'content', meta.content, (value) => {
      meta.content = value;
    });
}
