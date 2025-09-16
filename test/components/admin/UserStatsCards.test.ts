import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UserStatsCards from '../../../src/components/admin/UserStatsCards.vue';
import { withQuasarBrowser } from '../../browser-test-utils';
import { UserRole } from '../../../src/models/User';

describe('UserStatsCards - User Behavior', () => {
  const createUser = (
    overrides: Partial<{ role: UserRole; createdAt?: string; lastActive?: string }> = {},
  ) => ({
    role: UserRole.STUDENT,
    createdAt: new Date('2024-01-10T10:00:00Z').toISOString(),
    lastActive: new Date().toISOString(),
    ...overrides,
  });

  const users = [
    createUser(),
    createUser({
      role: UserRole.EDUCATOR,
      createdAt: new Date('2024-03-05T12:00:00Z').toISOString(),
    }),
    createUser({
      role: UserRole.STUDENT,
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    }),
    createUser({ role: UserRole.STUDENT, createdAt: new Date().toISOString() }),
  ];

  describe('Dashboard overview', () => {
    it('summarizes user metrics for admins at a glance', () => {
      const wrapper = mount(UserStatsCards, withQuasarBrowser({ props: { users } }));

      const statCards = wrapper.findAllComponents({ name: 'StatCard' });
      expect(statCards.length).toBe(4);

      const values = statCards.map((card) => card.props('value'));
      expect(values).toContain(users.length);
      expect(values).toContain(users.filter((user) => user.role === UserRole.STUDENT).length);
    });

    it('reacts to user data changes in real time', async () => {
      const wrapper = mount(UserStatsCards, withQuasarBrowser({ props: { users } }));

      const updatedUsers = [...users, createUser({ createdAt: new Date().toISOString() })];
      await wrapper.setProps({ users: updatedUsers });

      const statCards = wrapper.findAllComponents({ name: 'StatCard' });
      const values = statCards.map((card) => card.props('value'));
      expect(values).toContain(updatedUsers.length);
    });
  });

  describe('Edge cases', () => {
    it('handles empty user lists without errors', () => {
      const wrapper = mount(UserStatsCards, withQuasarBrowser({ props: { users: [] } }));

      const statCards = wrapper.findAllComponents({ name: 'StatCard' });
      statCards.forEach((card) => {
        expect(card.props('value')).toBe(0);
      });
    });
  });
});
