import {createI18n} from 'vue-i18n';
import {en, fr} from './messages';

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {en, fr},
});
