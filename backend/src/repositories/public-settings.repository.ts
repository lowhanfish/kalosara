import { prisma } from '../lib/prisma.js';
import { publicSettingsFields } from '../validators/public-settings.validator.js';

export async function findDemoContentAppSetting() {
  return prisma.appSetting.findUnique({
    where: { key: 'site.demoContent' },
    select: { value: true },
  });
}

export async function findPublicAppSettingRows() {
  return prisma.appSetting.findMany({
    where: { key: { in: Object.keys(publicSettingsFields) } },
    select: { key: true, value: true },
  });
}
