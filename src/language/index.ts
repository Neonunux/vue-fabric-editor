/*
 * @Author: June
 * @Description:
 * @Date: 2023-10-29 12:18:14
 * @LastEditors: June
 * @LastEditTime: 2023-11-01 12:01:24
 */
import { createI18n } from 'vue-i18n';
import zh from 'view-ui-plus/dist/locale/zh-CN';
import en from 'view-ui-plus/dist/locale/en-US'; // New version handle'iview'Change to'view-design'
import fr from 'view-ui-plus/dist/locale/fr-FR';
import FR from './fr.json';
import US from './en.json';
import CN from './zh.json';
import { getLocal, setLocal } from '@/utils/local';
import { LANG } from '@/config/constants/app';

const messages = {
  fr: Object.assign(FR, fr),
  en: Object.assign(US, en), // Combine your English bag and IView
  zh: Object.assign(CN, zh), // Combine your own Chinese bag and IView
};

function getLocalLang() {
  let localLang = getLocal(LANG);
  if (!localLang) {
    let defaultLang = navigator.language;
    if (defaultLang) {
      // eslint-disable-next-line prefer-destructuring
      defaultLang = defaultLang.split('-')[0];
      // eslint-disable-next-line prefer-destructuring
      localLang = defaultLang.split('-')[0];
    }
    setLocal(LANG, defaultLang);
  }
  return localLang;
}
const lang = getLocalLang();

const i18n = createI18n({
  allowComposition: true,
  globalInjection: true,
  legacy: false,
  locale: lang,
  messages,
});

export default i18n;

export const t = (key: any) => {
  return i18n.global.t(key);
};
