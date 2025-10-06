import { defineBoot } from '#q-app/wrappers';
import { LocalStorage } from 'quasar';
import { createI18n } from 'vue-i18n';

import messages from 'src/i18n';

export type MessageLanguages = keyof typeof messages;
// Type-define 'en-US' as the master schema for the resource
export type MessageSchema = (typeof messages)['en-US'];

// See https://vue-i18n.intlify.dev/guide/advanced/typescript.html#global-resource-schema-type-definition
/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module 'vue-i18n' {
  // define the locale messages schema
  export interface DefineLocaleMessage extends MessageSchema {}

  // define the datetime format schema
  export interface DefineDateTimeFormat {}

  // define the number format schema
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

const STORAGE_KEY = 'preferred-locale';
const DEFAULT_LOCALE: MessageLanguages = 'en-US';
const SUPPORTED_LOCALES = Object.keys(messages) as MessageLanguages[];

const resolveInitialLocale = (): MessageLanguages => {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const stored = LocalStorage.getItem<MessageLanguages>(STORAGE_KEY);
  if (stored && SUPPORTED_LOCALES.includes(stored)) {
    return stored;
  }

  const navigatorLocale = window.navigator.language?.toLowerCase() ?? '';
  if (navigatorLocale) {
    const exactMatch = SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === navigatorLocale);
    if (exactMatch) {
      return exactMatch;
    }

    const navigatorShort = navigatorLocale.split('-')[0];
    const shortMatch = SUPPORTED_LOCALES.find(
      (locale) => locale.toLowerCase().split('-')[0] === navigatorShort,
    );
    if (shortMatch) {
      return shortMatch;
    }
  }

  return DEFAULT_LOCALE;
};

export default defineBoot(({ app }) => {
  const initialLocale = resolveInitialLocale();

  const i18n = createI18n<{ message: MessageSchema }, MessageLanguages>({
    locale: initialLocale,
    fallbackLocale: DEFAULT_LOCALE,
    legacy: false,
    messages,
    datetimeFormats: {
      'en-US': {
        short: {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        },
        long: {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
        },
        datetime: {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        },
      },
      fr: {
        short: {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        },
        long: {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
        },
        datetime: {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        },
      },
    },
  });

  // Set i18n instance on app
  app.use(i18n);

  if (typeof window !== 'undefined') {
    LocalStorage.set(STORAGE_KEY, initialLocale);
  }
});
