// Helper to find a q-btn by icon name
import type { DOMWrapper } from '@vue/test-utils';

import type { VueWrapper } from '@vue/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { ComponentPublicInstance } from 'vue';
import AvatarPicker from '../../../src/components/ui/AvatarPicker.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

function findBtnByIcon(
  wrapper: ReturnType<typeof buildWrapper>,
  iconName: string,
): DOMWrapper<Element> | undefined {
  return wrapper.findAll('.q-btn').find((btn) => {
    return btn.find('i.q-icon').exists() && btn.find('i.q-icon').text() === iconName;
  });
}
const buildWrapper = (value: string | null = null): VueWrapper<ComponentPublicInstance> =>
  mount(
    AvatarPicker,
    withQuasarBrowser({
      props: { modelValue: value },
    }),
  );

describe('AvatarPicker - User Behavior', () => {
  it('generates a grid of avatar options for quick selection', () => {
    const wrapper = buildWrapper();
    const cards = wrapper.findAllComponents({ name: 'QCard' });
    expect(cards.length).toBeGreaterThan(0);
  });

  it('emits a full avatar URL when a user selects an option', async () => {
    const wrapper = buildWrapper();
    const cards = wrapper.findAllComponents({ name: 'QCard' });
    expect(cards.length).toBeGreaterThan(0);

    await cards[0]?.trigger('click');

    const emission = wrapper.emitted('update:modelValue')?.at(-1)?.[0];
    expect(typeof emission).toBe('string');
    expect(emission).toMatch(/https:\/\/api\.dicebear\.com\/9\.x\/adventurer\/svg\?seed=/);
  });

  it('clears the avatar when the user chooses the clear action', async () => {
    const wrapper = buildWrapper('https://api.dicebear.com/9.x/adventurer/svg?seed=test');
    const clearBtn = findBtnByIcon(wrapper, 'close');
    await clearBtn!.trigger('click');

    const emission = wrapper.emitted('update:modelValue')?.at(-1)?.[0];
    expect(emission).toBeNull();
  });
});
