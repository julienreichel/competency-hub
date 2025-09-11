import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UserStatsCards from '../../../src/components/admin/UserStatsCards.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('UserStatsCards Component', () => {
  const mockStats = {
    total: 1250,
    active: 980,
    newThisMonth: 45,
    onlineNow: 127,
  };

  it('should render with stats prop', () => {
    const wrapper = mount(
      UserStatsCards,
      withQuasarBrowser({
        props: {
          stats: mockStats,
        },
      }),
    );

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.row').exists()).toBe(true);
  });

  it('should render all four StatCard components', () => {
    const wrapper = mount(
      UserStatsCards,
      withQuasarBrowser({
        props: {
          stats: mockStats,
        },
      }),
    );

    const statCards = wrapper.findAllComponents({ name: 'StatCard' });
    expect(statCards.length).toBe(4);
  });

  it('should pass correct props to Total Users StatCard', () => {
    const wrapper = mount(
      UserStatsCards,
      withQuasarBrowser({
        props: {
          stats: mockStats,
        },
      }),
    );

    const statCards = wrapper.findAllComponents({ name: 'StatCard' });
    expect(statCards.length).toBeGreaterThanOrEqual(1);
    if (statCards[0]) {
      expect(statCards[0].props('icon')).toBe('people');
      expect(statCards[0].props('color')).toBe('blue');
      expect(statCards[0].props('value')).toBe(1250);
      expect(statCards[0].props('label')).toBe('Total Users');
    }
  });

  it('should pass correct props to Active Users StatCard', () => {
    const wrapper = mount(
      UserStatsCards,
      withQuasarBrowser({
        props: {
          stats: mockStats,
        },
      }),
    );

    const statCards = wrapper.findAllComponents({ name: 'StatCard' });
    expect(statCards.length).toBeGreaterThanOrEqual(2);
    if (statCards[1]) {
      expect(statCards[1].props('icon')).toBe('check_circle');
      expect(statCards[1].props('color')).toBe('green');
      expect(statCards[1].props('value')).toBe(980);
      expect(statCards[1].props('label')).toBe('Active Users');
    }
  });

  it('should pass correct props to New This Month StatCard', () => {
    const wrapper = mount(
      UserStatsCards,
      withQuasarBrowser({
        props: {
          stats: mockStats,
        },
      }),
    );

    const statCards = wrapper.findAllComponents({ name: 'StatCard' });
    expect(statCards.length).toBeGreaterThanOrEqual(3);
    if (statCards[2]) {
      expect(statCards[2].props('icon')).toBe('person_add');
      expect(statCards[2].props('color')).toBe('purple');
      expect(statCards[2].props('value')).toBe(45);
      expect(statCards[2].props('label')).toBe('New This Month');
    }
  });

  it('should pass correct props to Online Now StatCard', () => {
    const wrapper = mount(
      UserStatsCards,
      withQuasarBrowser({
        props: {
          stats: mockStats,
        },
      }),
    );

    const statCards = wrapper.findAllComponents({ name: 'StatCard' });
    expect(statCards.length).toBeGreaterThanOrEqual(4);
    if (statCards[3]) {
      expect(statCards[3].props('icon')).toBe('schedule');
      expect(statCards[3].props('color')).toBe('orange');
      expect(statCards[3].props('value')).toBe(127);
      expect(statCards[3].props('label')).toBe('Online Now');
    }
  });

  it('should update StatCard values when stats prop changes', async () => {
    const wrapper = mount(
      UserStatsCards,
      withQuasarBrowser({
        props: {
          stats: mockStats,
        },
      }),
    );

    const newStats = {
      total: 1500,
      active: 1200,
      newThisMonth: 75,
      onlineNow: 150,
    };

    await wrapper.setProps({ stats: newStats });

    const statCards = wrapper.findAllComponents({ name: 'StatCard' });
    expect(statCards.length).toBe(4);

    if (statCards[0] && statCards[1] && statCards[2] && statCards[3]) {
      expect(statCards[0].props('value')).toBe(1500);
      expect(statCards[1].props('value')).toBe(1200);
      expect(statCards[2].props('value')).toBe(75);
      expect(statCards[3].props('value')).toBe(150);
    }
  });

  it('should handle zero values correctly', () => {
    const zeroStats = {
      total: 0,
      active: 0,
      newThisMonth: 0,
      onlineNow: 0,
    };

    const wrapper = mount(
      UserStatsCards,
      withQuasarBrowser({
        props: {
          stats: zeroStats,
        },
      }),
    );

    const statCards = wrapper.findAllComponents({ name: 'StatCard' });

    statCards.forEach((card) => {
      expect(card.props('value')).toBe(0);
    });
  });

  it('should have proper grid layout', () => {
    const wrapper = mount(
      UserStatsCards,
      withQuasarBrowser({
        props: {
          stats: mockStats,
        },
      }),
    );

    const row = wrapper.find('.row');
    expect(row.exists()).toBe(true);
    expect(row.classes()).toContain('q-gutter-md');
    expect(row.classes()).toContain('q-mt-lg');

    const columns = wrapper.findAll('.col-12');
    expect(columns.length).toBe(4);

    columns.forEach((col) => {
      expect(col.classes()).toContain('col-sm-6');
      expect(col.classes()).toContain('col-md-3');
    });
  });

  it('should have unique keys for each StatCard', () => {
    const wrapper = mount(
      UserStatsCards,
      withQuasarBrowser({
        props: {
          stats: mockStats,
        },
      }),
    );

    const columns = wrapper.findAll('[key]');
    const keys = columns.map((col) => col.attributes('key'));
    const uniqueKeys = new Set(keys);

    expect(uniqueKeys.size).toBe(keys.length); // All keys should be unique
  });

  it('should handle large numbers correctly', () => {
    const largeStats = {
      total: 999999,
      active: 888888,
      newThisMonth: 777777,
      onlineNow: 666666,
    };

    const wrapper = mount(
      UserStatsCards,
      withQuasarBrowser({
        props: {
          stats: largeStats,
        },
      }),
    );

    const statCards = wrapper.findAllComponents({ name: 'StatCard' });
    expect(statCards.length).toBe(4);

    if (statCards[0] && statCards[1] && statCards[2] && statCards[3]) {
      expect(statCards[0].props('value')).toBe(999999);
      expect(statCards[1].props('value')).toBe(888888);
      expect(statCards[2].props('value')).toBe(777777);
      expect(statCards[3].props('value')).toBe(666666);
    }
  });

  it('should maintain consistent styling across all cards', () => {
    const wrapper = mount(
      UserStatsCards,
      withQuasarBrowser({
        props: {
          stats: mockStats,
        },
      }),
    );

    const statCards = wrapper.findAllComponents({ name: 'StatCard' });

    // All cards should have different colors
    const colors = statCards.map((card) => card.props('color'));
    expect(colors).toEqual(['blue', 'green', 'purple', 'orange']);

    // All cards should have different icons
    const icons = statCards.map((card) => card.props('icon'));
    expect(icons).toEqual(['people', 'check_circle', 'person_add', 'schedule']);
  });
});
