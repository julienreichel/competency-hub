import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import StatusIndicator from '../../../src/components/ui/StatusIndicator.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('StatusIndicator Component', () => {
  it('should render Active status with correct icon and color', () => {
    const wrapper = mount(
      StatusIndicator,
      withQuasarBrowser({
        props: {
          status: 'Active',
        },
      }),
    );

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('span').text()).toBe('Active');

    const iconElement = wrapper.find('.q-icon');
    expect(iconElement.exists()).toBe(true);
  });

  it('should render Inactive status with correct styling', () => {
    const wrapper = mount(
      StatusIndicator,
      withQuasarBrowser({
        props: {
          status: 'Inactive',
        },
      }),
    );

    expect(wrapper.find('span').text()).toBe('Inactive');
    expect(wrapper.find('.q-icon').exists()).toBe(true);
  });

  it('should render Suspended status with correct styling', () => {
    const wrapper = mount(
      StatusIndicator,
      withQuasarBrowser({
        props: {
          status: 'Suspended',
        },
      }),
    );

    expect(wrapper.find('span').text()).toBe('Suspended');
    expect(wrapper.find('.q-icon').exists()).toBe(true);
  });

  it('should have proper flex layout structure', () => {
    const wrapper = mount(
      StatusIndicator,
      withQuasarBrowser({
        props: {
          status: 'Active',
        },
      }),
    );

    const containerElement = wrapper.find('.flex');
    expect(containerElement.exists()).toBe(true);
    expect(containerElement.classes()).toContain('items-center');
    expect(containerElement.classes()).toContain('q-gutter-xs');
  });

  it('should display all status types correctly', () => {
    const statuses: Array<'Active' | 'Inactive' | 'Suspended'> = [
      'Active',
      'Inactive',
      'Suspended',
    ];

    statuses.forEach((status) => {
      const wrapper = mount(
        StatusIndicator,
        withQuasarBrowser({
          props: {
            status,
          },
        }),
      );

      expect(wrapper.find('span').text()).toBe(status);
      expect(wrapper.find('.q-icon').exists()).toBe(true);
    });
  });

  it('should have icon and text elements in correct order', () => {
    const wrapper = mount(
      StatusIndicator,
      withQuasarBrowser({
        props: {
          status: 'Active',
        },
      }),
    );

    const container = wrapper.find('.flex');
    const children = container.element.children;

    // Should have icon first, then span
    expect(children.length).toBe(2);
    expect(children[0]?.classList.contains('q-icon')).toBe(true);
    expect(children[1]?.tagName.toLowerCase()).toBe('span');
  });

  it('should handle status prop reactivity', async () => {
    const wrapper = mount(
      StatusIndicator,
      withQuasarBrowser({
        props: {
          status: 'Active',
        },
      }),
    );

    expect(wrapper.find('span').text()).toBe('Active');

    // Test prop update
    await wrapper.setProps({ status: 'Suspended' });
    expect(wrapper.find('span').text()).toBe('Suspended');
  });
});
