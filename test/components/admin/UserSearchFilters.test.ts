import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UserSearchFilters from '../../../src/components/admin/UserSearchFilters.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('UserSearchFilters - User Behavior', () => {
  const baseProps = {
    search: '',
    roleFilter: null,
    roleOptions: ['Administrator', 'Educator', 'Student', 'Parent'],
  };

  describe('Search interactions', () => {
    it('notifies parent when search input changes', async () => {
      const wrapper = mount(UserSearchFilters, withQuasarBrowser({ props: baseProps }));
      await wrapper.vm.$nextTick();

      const searchInput = wrapper.findComponent({ name: 'QInput' });
      expect(searchInput.exists()).toBe(true);

      await searchInput.vm.$emit('update:modelValue', 'john doe');

      expect(wrapper.emitted('update:search')).toBeTruthy();
      expect(wrapper.emitted('update:search')?.[0]).toEqual(['john doe']);
    });

    it('provides a debounced search field with helper icon', () => {
      const wrapper = mount(UserSearchFilters, withQuasarBrowser({ props: baseProps }));
      const searchInput = wrapper.findComponent({ name: 'QInput' });
      expect(searchInput.props('debounce')).toBe('300');
      expect(wrapper.html()).toMatch(/search/);
    });
  });

  describe('Role filtering', () => {
    it('emits updated role selection', async () => {
      const wrapper = mount(UserSearchFilters, withQuasarBrowser({ props: baseProps }));
      const roleSelect = wrapper.findComponent({ name: 'QSelect' });
      expect(roleSelect.exists()).toBe(true);

      await roleSelect.vm.$emit('update:modelValue', 'Educator');

      expect(wrapper.emitted('update:roleFilter')).toBeTruthy();
      expect(wrapper.emitted('update:roleFilter')?.[0]).toEqual(['Educator']);
    });

    it('handles empty role option lists gracefully', () => {
      const wrapper = mount(
        UserSearchFilters,
        withQuasarBrowser({
          props: { search: '', roleFilter: null, roleOptions: [] },
        }),
      );

      const roleSelect = wrapper.findComponent({ name: 'QSelect' });
      expect(roleSelect.exists()).toBe(true);
      expect(roleSelect.props('options')).toEqual([]);
    });

    it('preserves previously selected role', () => {
      const wrapper = mount(
        UserSearchFilters,
        withQuasarBrowser({
          props: { ...baseProps, roleFilter: 'Administrator' },
        }),
      );

      const roleSelect = wrapper.findComponent({ name: 'QSelect' });
      expect(roleSelect.props('modelValue')).toBe('Administrator');
    });
  });

  describe('Layout and accessibility', () => {
    it('arranges filters with consistent spacing', () => {
      const wrapper = mount(UserSearchFilters, withQuasarBrowser({ props: baseProps }));
      const container = wrapper.find('[data-testid="user-search-filters"]');
      expect(container.exists()).toBe(true);
      expect(container.classes()).toContain('q-gutter-md');

      const searchInput = wrapper.findComponent({ name: 'QInput' });
      const roleSelect = wrapper.findComponent({ name: 'QSelect' });
      expect(searchInput.exists()).toBe(true);
      expect(roleSelect.exists()).toBe(true);
    });
  });
});
