import type { ComponentMountingOptions } from '@vue/test-utils';
import {
  QBadge,
  QBtn,
  QBtnGroup,
  QCard,
  QCardSection,
  QChip,
  QIcon,
  QInput,
  QItem,
  QItemSection,
  QLinearProgress,
  QList,
  QMenu,
  QSelect,
  QSpinner,
  QTable,
  QToggle,
  QTooltip,
  Quasar,
} from 'quasar';
import { createI18n } from 'vue-i18n';
import messages from '../src/i18n';

export const quasarOptions = {
  config: {},
  plugins: {},
  components: {
    QCard,
    QCardSection,
    QBadge,
    QIcon,
    QBtn,
    QBtnGroup,
    QSpinner,
    QToggle,
    QList,
    QItem,
    QItemSection,
    QChip,
    QTooltip,
    QLinearProgress,
    QTable,
    QInput,
    QSelect,
    QMenu,
  },
};

// Create i18n instance for tests
const i18n = createI18n({
  locale: 'en-US',
  legacy: false,
  messages,
});

/**
 * Provides Quasar configuration for testing with real components
 * @param component - Vue Test Utils mount options
 * @returns Modified options with Quasar global configuration
 */
export function withQuasarBrowser<T>(
  component?: ComponentMountingOptions<T>,
): ComponentMountingOptions<T> {
  const baseConfig: ComponentMountingOptions<T> = {
    global: {
      plugins: [[Quasar, quasarOptions] as const, i18n],
    },
  };

  if (!component) {
    return baseConfig;
  }

  // If component has global config, we need to merge carefully
  if (component.global) {
    return {
      ...component,
      global: {
        ...baseConfig.global,
        ...component.global,
        plugins: [...(baseConfig.global?.plugins || []), ...(component.global.plugins || [])],
      },
    };
  }

  // If no global config, use the simple spread
  return {
    ...baseConfig,
    ...component,
  };
}
