import type { ComponentMountingOptions } from '@vue/test-utils';
import {
  Quasar,
  QCard,
  QCardSection,
  QBadge,
  QIcon,
  QBtn,
  QSpinner,
  QToggle,
  QList,
  QItem,
  QItemSection,
  QChip,
  QTooltip,
  QLinearProgress,
  QTable,
} from 'quasar';

export const quasarOptions = {
  config: {},
  plugins: {},
  components: {
    QCard,
    QCardSection,
    QBadge,
    QIcon,
    QBtn,
    QSpinner,
    QToggle,
    QList,
    QItem,
    QItemSection,
    QChip,
    QTooltip,
    QLinearProgress,
    QTable,
  },
};

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
      plugins: [[Quasar, quasarOptions] as const],
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
