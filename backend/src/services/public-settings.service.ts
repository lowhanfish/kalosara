import { projectPublicSettings } from '../validators/public-settings.validator.js';
import {
  findDemoContentAppSetting,
  findPublicAppSettingRows,
} from '../repositories/public-settings.repository.js';
import { readSettings } from './profile.service.js';

export async function getPublicSettingsService() {
  const settings = await readSettings();
  if (settings) {
    const demo = await findDemoContentAppSetting();
    return {
      settings: {
        ...settings,
        isExample: false,
        demoContent: demo?.value === true,
      },
    };
  }
  const rows = await findPublicAppSettingRows();
  return { settings: projectPublicSettings(rows) };
}
