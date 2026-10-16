import { resolve } from 'node:path';
import { env } from '../../config/env.js';

export const uploadSources = ['news', 'profile', 'officials', 'settings', 'general'] as const;
export const uploadRoot = resolve(env.UPLOAD_ROOT);
export function storageKey(source: typeof uploadSources[number], id: string, extension: string, image: boolean) {
  return `${source}/${image ? 'images' : 'documents'}/${id}.${extension}`;
}
export function filePath(key: string) {
  // Old database rows contain a UUID filename only; preserve their URLs after moving files.
  if (/^[0-9a-f-]{36}(?:-(?:thumb|display))?\.[a-z]+$/.test(key)) return resolve(uploadRoot, 'legacy', key);
  if (!/^(?:news|profile|officials|settings|general)\/(?:images|documents)\/[0-9a-f-]{36}(?:-(?:thumb|display))?\.[a-z]+$/.test(key)) throw new Error('Invalid media storage key');
  return resolve(uploadRoot, key);
}
export function variantKey(key: string, variant: 'thumb' | 'display') {
  return key.replace(/\.[a-z]+$/, `-${variant}.webp`);
}
