import type { ComponentMountingOptions } from '@vue/test-utils';
import { h, type VNode } from 'vue';

/**
 * Provides Quasar configuration for browser testing
 * Simplified version to avoid plugin duplication issues
 * @param options - Vue Test Utils mount options
 * @returns Modified options with Quasar global configuration
 */
export function withQuasarBrowser<T>(
  options: ComponentMountingOptions<T> = {},
): ComponentMountingOptions<T> {
  return {
    ...options,
    global: {
      ...options.global,
      stubs: {
        // Stub Quasar components for browser testing using render functions
        QChip: {
          props: ['color', 'textColor', 'size'],
          render(): VNode {
            return h('span', { class: 'q-chip' }, this.$slots.default?.());
          },
        },
        QBtn: {
          props: ['color', 'size', 'flat', 'round'],
          render(): VNode {
            return h('button', { class: 'q-btn' }, this.$slots.default?.());
          },
        },
        QIcon: {
          props: ['name', 'color', 'size'],
          render(): VNode {
            return h('i', { class: 'q-icon' }, this.$slots.default?.());
          },
        },
        ...options.global?.stubs,
      },
    },
  };
}
