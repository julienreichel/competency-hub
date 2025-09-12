import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UserStatsCards from '../../../src/components/admin/UserStatsCards.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('UserStatsCards - User Behavior', () => {
  const sampleStats = {
    total: 1250,
    active: 980,
    newThisMonth: 45,
    onlineNow: 127,
  };

  describe('When admin needs system overview', () => {
    it('displays total user count for capacity planning', () => {
      // Arrange: Admin wants to understand system scale
      const wrapper = mount(
        UserStatsCards,
        withQuasarBrowser({
          props: { stats: sampleStats },
        }),
      );

      // Assert: Admin can see total user count prominently
      const statCards = wrapper.findAllComponents({ name: 'StatCard' });
      const totalCard = statCards.find(
        (card) => card.props('value') === 1250 && card.props('label')?.includes('Total'),
      );

      expect(totalCard?.exists()).toBe(true);
      expect(totalCard?.props('value')).toBe(1250);

      // Behavior: Total users should be visually distinct (blue color theme)
      expect(totalCard?.props('color')).toBe('blue');
      expect(totalCard?.props('icon')).toBe('people');
    });

    it('shows active user count for engagement monitoring', () => {
      // Arrange: Admin monitors user engagement
      const wrapper = mount(
        UserStatsCards,
        withQuasarBrowser({
          props: { stats: sampleStats },
        }),
      );

      // Assert: Admin can see active user metrics
      const statCards = wrapper.findAllComponents({ name: 'StatCard' });
      const activeCard = statCards.find(
        (card) => card.props('value') === 980 && card.props('label')?.includes('Active'),
      );

      expect(activeCard?.exists()).toBe(true);
      expect(activeCard?.props('value')).toBe(980);

      // Behavior: Active users should convey positive status (green color)
      expect(activeCard?.props('color')).toBe('green');
      expect(activeCard?.props('icon')).toBe('check_circle');
    });

    it('highlights new user growth for trend analysis', () => {
      // Arrange: Admin tracks user acquisition
      const wrapper = mount(
        UserStatsCards,
        withQuasarBrowser({
          props: { stats: sampleStats },
        }),
      );

      // Assert: Admin can see new user growth metrics
      const statCards = wrapper.findAllComponents({ name: 'StatCard' });
      const newUsersCard = statCards.find(
        (card) => card.props('value') === 45 && card.props('label')?.includes('New'),
      );

      expect(newUsersCard?.exists()).toBe(true);
      expect(newUsersCard?.props('value')).toBe(45);

      // Behavior: New users should convey growth (purple for distinction)
      expect(newUsersCard?.props('color')).toBe('purple');
      expect(newUsersCard?.props('icon')).toBe('person_add');
    });

    it('displays current online users for real-time monitoring', () => {
      // Arrange: Admin monitors current system load
      const wrapper = mount(
        UserStatsCards,
        withQuasarBrowser({
          props: { stats: sampleStats },
        }),
      );

      // Assert: Admin can see real-time user activity
      const statCards = wrapper.findAllComponents({ name: 'StatCard' });
      const onlineCard = statCards.find(
        (card) => card.props('value') === 127 && card.props('label')?.includes('Online'),
      );

      expect(onlineCard?.exists()).toBe(true);
      expect(onlineCard?.props('value')).toBe(127);

      // Behavior: Online users should convey real-time activity (orange for attention)
      expect(onlineCard?.props('color')).toBe('orange');
      expect(onlineCard?.props('icon')).toBe('schedule');
    });

    it('provides complete dashboard overview in single view', () => {
      // Arrange: Admin needs comprehensive user statistics
      const wrapper = mount(
        UserStatsCards,
        withQuasarBrowser({
          props: { stats: sampleStats },
        }),
      );

      // Assert: Admin sees all key metrics at once
      const statCards = wrapper.findAllComponents({ name: 'StatCard' });
      expect(statCards.length).toBe(4);

      // Behavior: All critical user metrics are visible simultaneously
      const values = statCards.map((card) => card.props('value'));
      expect(values).toContain(1250); // Total
      expect(values).toContain(980); // Active
      expect(values).toContain(45); // New
      expect(values).toContain(127); // Online
    });
  });

  describe('When monitoring system health and trends', () => {
    it('updates metrics in real-time as data changes', async () => {
      // Arrange: Admin has dashboard open as system updates
      const wrapper = mount(
        UserStatsCards,
        withQuasarBrowser({
          props: { stats: sampleStats },
        }),
      );

      // Act: System receives updated statistics
      const updatedStats = {
        total: 1275,
        active: 1005,
        newThisMonth: 50,
        onlineNow: 135,
      };

      await wrapper.setProps({ stats: updatedStats });

      // Assert: Admin sees updated metrics immediately
      const statCards = wrapper.findAllComponents({ name: 'StatCard' });
      const values = statCards.map((card) => card.props('value'));

      expect(values).toContain(1275); // Updated total
      expect(values).toContain(1005); // Updated active
      expect(values).toContain(50); // Updated new
      expect(values).toContain(135); // Updated online
    });

    it('handles edge cases like zero users gracefully', () => {
      // Arrange: New system or maintenance period
      const emptyStats = {
        total: 0,
        active: 0,
        newThisMonth: 0,
        onlineNow: 0,
      };

      // Act: Display stats during low/no activity period
      const wrapper = mount(
        UserStatsCards,
        withQuasarBrowser({
          props: { stats: emptyStats },
        }),
      );

      // Assert: Admin sees clear indication of empty state
      const statCards = wrapper.findAllComponents({ name: 'StatCard' });
      statCards.forEach((card) => {
        expect(card.props('value')).toBe(0);
      });

      // Behavior: Zero values don't break the interface
      expect(statCards.length).toBe(4);
    });

    it('displays large user counts without interface degradation', () => {
      // Arrange: Large enterprise deployment
      const enterpriseStats = {
        total: 999999,
        active: 750000,
        newThisMonth: 5000,
        onlineNow: 25000,
      };

      // Act: Display enterprise-scale statistics
      const wrapper = mount(
        UserStatsCards,
        withQuasarBrowser({
          props: { stats: enterpriseStats },
        }),
      );

      // Assert: Admin can read large numbers clearly
      const statCards = wrapper.findAllComponents({ name: 'StatCard' });
      const values = statCards.map((card) => card.props('value'));

      expect(values).toContain(999999);
      expect(values).toContain(750000);
      expect(values).toContain(5000);
      expect(values).toContain(25000);

      // Behavior: Large numbers don't break card layout
      expect(statCards.length).toBe(4);
    });
  });

  describe('Dashboard Layout and User Experience', () => {
    it('organizes metrics in logical visual hierarchy', () => {
      // Arrange: Admin needs quick understanding of system status
      const wrapper = mount(
        UserStatsCards,
        withQuasarBrowser({
          props: { stats: sampleStats },
        }),
      );

      // Assert: Cards are arranged in responsive grid layout
      const container = wrapper.find('.row');
      expect(container.exists()).toBe(true);
      expect(container.classes()).toContain('q-gutter-md');

      // Behavior: Cards adapt to different screen sizes
      const columns = wrapper.findAll('.col-12');
      expect(columns.length).toBe(4);

      // Each card responsive: mobile (full width), tablet (half), desktop (quarter)
      columns.forEach((col) => {
        expect(col.classes()).toContain('col-sm-6');
        expect(col.classes()).toContain('col-md-3');
      });
    });

    it('uses distinct visual indicators for different metric types', () => {
      // Arrange: Admin needs to quickly differentiate metrics
      const wrapper = mount(
        UserStatsCards,
        withQuasarBrowser({
          props: { stats: sampleStats },
        }),
      );

      // Assert: Each metric has unique visual identity
      const statCards = wrapper.findAllComponents({ name: 'StatCard' });

      // Behavior: Colors and icons create clear visual distinction
      const colors = statCards.map((card) => card.props('color'));
      const icons = statCards.map((card) => card.props('icon'));

      // All colors should be unique
      expect(new Set(colors).size).toBe(4);
      // All icons should be unique
      expect(new Set(icons).size).toBe(4);

      // Verify semantic color choices
      expect(colors).toContain('blue'); // Total (neutral)
      expect(colors).toContain('green'); // Active (positive)
      expect(colors).toContain('purple'); // New (growth)
      expect(colors).toContain('orange'); // Online (attention)
    });

    it('maintains consistent spacing and alignment across cards', () => {
      // Arrange: Admin needs professional, organized interface
      const wrapper = mount(
        UserStatsCards,
        withQuasarBrowser({
          props: { stats: sampleStats },
        }),
      );

      // Assert: Cards have consistent spacing and layout
      const container = wrapper.find('.row');
      expect(container.classes()).toContain('q-gutter-md'); // Consistent spacing
      expect(container.classes()).toContain('q-mt-lg'); // Top margin for separation

      // Behavior: Each card gets equal space and alignment
      const columns = wrapper.findAll('.col-12');
      expect(columns.length).toBe(4);

      // Each card should have proper structure for Vue rendering
      const statCards = wrapper.findAllComponents({ name: 'StatCard' });
      expect(statCards.length).toBe(4);
    });

    it('supports quick scanning of all metrics simultaneously', () => {
      // Arrange: Admin needs rapid status assessment
      const wrapper = mount(
        UserStatsCards,
        withQuasarBrowser({
          props: { stats: sampleStats },
        }),
      );

      // Assert: All key metrics visible without scrolling
      const statCards = wrapper.findAllComponents({ name: 'StatCard' });
      expect(statCards.length).toBe(4);

      // Behavior: Labels clearly identify each metric
      const labels = statCards.map((card) => card.props('label'));
      expect(labels).toContain('Total Users');
      expect(labels).toContain('Active Users');
      expect(labels).toContain('New This Month');
      expect(labels).toContain('Online Now');

      // All labels should be unique and descriptive
      expect(new Set(labels).size).toBe(4);
    });
  });
});
