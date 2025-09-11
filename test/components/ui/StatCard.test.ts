import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import StatCard from '../../../src/components/ui/StatCard.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('StatCard Component', () => {
  it('should render with required props', () => {
    const wrapper = mount(
      StatCard,
      withQuasarBrowser({
        props: {
          icon: 'people',
          color: 'primary',
          value: 42,
          label: 'Users',
        },
      }),
    );

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.q-card').exists()).toBe(true);
  });

  it('should display the icon with correct properties', () => {
    const wrapper = mount(
      StatCard,
      withQuasarBrowser({
        props: {
          icon: 'star',
          color: 'amber',
          value: 5,
          label: 'Rating',
        },
      }),
    );

    const iconElement = wrapper.find('.q-icon');
    expect(iconElement.exists()).toBe(true);
  });

  it('should display numeric value correctly', () => {
    const wrapper = mount(
      StatCard,
      withQuasarBrowser({
        props: {
          icon: 'trending_up',
          color: 'green',
          value: 1234,
          label: 'Revenue',
        },
      }),
    );

    expect(wrapper.text()).toContain('1234');
  });

  it('should display string value correctly', () => {
    const wrapper = mount(
      StatCard,
      withQuasarBrowser({
        props: {
          icon: 'schedule',
          color: 'blue',
          value: '24/7',
          label: 'Availability',
        },
      }),
    );

    expect(wrapper.text()).toContain('24/7');
  });

  it('should display label text', () => {
    const wrapper = mount(
      StatCard,
      withQuasarBrowser({
        props: {
          icon: 'notifications',
          color: 'orange',
          value: 15,
          label: 'Notifications',
        },
      }),
    );

    expect(wrapper.text()).toContain('Notifications');
  });

  it('should have proper card structure', () => {
    const wrapper = mount(
      StatCard,
      withQuasarBrowser({
        props: {
          icon: 'dashboard',
          color: 'purple',
          value: 100,
          label: 'Progress',
        },
      }),
    );

    const cardSection = wrapper.find('.q-card__section');
    expect(cardSection.exists()).toBe(true);
    expect(cardSection.classes()).toContain('text-center');
  });

  it('should handle different colors', () => {
    const wrapper = mount(
      StatCard,
      withQuasarBrowser({
        props: {
          icon: 'palette',
          color: 'teal',
          value: 256,
          label: 'Colors',
        },
      }),
    );

    const iconElement = wrapper.find('.q-icon');
    expect(iconElement.exists()).toBe(true);
  });
});
