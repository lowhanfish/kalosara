import { z } from 'zod';
import {
  defaultSettings,
  officialSchema,
  pageSchema,
  pageSlug,
  settingSchema,
} from '../validators/profile.validator.js';
import {
  findSiteSettingRow,
  listAllPagesAndOfficials,
  listPublishedPagesAndOfficials,
  upsertOfficialInTx,
  upsertProfilePageInTx,
  upsertSiteSettingInTx,
} from '../repositories/profile.repository.js';
import {
  enqueueInvalidation,
  notifyInvalidation,
} from './cache-invalidation.service.js';

export async function readSettings() {
  const row = await findSiteSettingRow();
  const parsed = settingSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : null;
}

export async function getPublicProfileService() {
  const [pages, officials] = await listPublishedPagesAndOfficials();
  return { pages, officials };
}

export async function getAdminProfileService() {
  const [settings, [pages, officials]] = await Promise.all([
    readSettings(),
    listAllPagesAndOfficials(),
  ]);
  return { settings: settings ?? defaultSettings, pages, officials };
}

export async function updateProfileSettingsService(
  body: unknown,
  actorId: string,
) {
  const value = settingSchema.parse(body);
  const event = await upsertSiteSettingInTx({
    value,
    actorId,
    enqueueCache: (tx) => enqueueInvalidation(tx, ['site-settings']),
  });
  await notifyInvalidation(event.id);
  return { settings: value };
}

export async function saveProfilePageService(
  rawSlug: unknown,
  body: unknown,
  actorId: string,
) {
  const slug = pageSlug.parse(rawSlug);
  const value = pageSchema.parse(body);
  const page = await upsertProfilePageInTx({
    slug,
    value,
    actorId,
    enqueueCache: (tx) => enqueueInvalidation(tx, ['public-profile']),
  });
  await notifyInvalidation(page.event.id);
  return { page: page.result };
}

export async function saveProfileOfficialService(
  rawId: unknown,
  body: unknown,
  actorId: string,
) {
  const id = z.uuid().parse(rawId);
  const parsed = officialSchema.parse(body);
  const value = {
    ...parsed,
    termStart: parsed.termStart ? new Date(parsed.termStart) : null,
    termEnd: parsed.termEnd ? new Date(parsed.termEnd) : null,
  };
  const official = await upsertOfficialInTx({
    id,
    value,
    actorId,
    enqueueCache: (tx) => enqueueInvalidation(tx, ['public-profile']),
  });
  await notifyInvalidation(official.event.id);
  return { official: official.result };
}
