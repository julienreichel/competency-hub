import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UserSearchFilters from '../../../src/components/admin/UserSearchFilters.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('UserSearchFilters - User Behavior', () => {
  const sampleProps = {
    search: '',
    roleFilter: null,
    statusFilter: null,
    roleOptions: ['Administrator', 'Educator', 'Student', 'Parent'],
    statusOptions: ['Active', 'Inactive', 'Suspended'],
  };

  describe('When admin needs to find specific users', () => {
    it('allows searching users by name or email', async () => {
      // Arrange: Admin wants to find a specific user
      const wrapper = mount(
        UserSearchFilters,
        withQuasarBrowser({
          props: sampleProps,
        }),
      );

      // Act: Admin types in search box
      const searchInput = wrapper.findComponent({ name: 'QInput' });
      expect(searchInput.exists()).toBe(true);

      await searchInput.vm.$emit('update:modelValue', 'john doe');

      // Assert: Search criteria is communicated to parent
      expect(wrapper.emitted('update:search')).toBeTruthy();
      expect(wrapper.emitted('update:search')?.[0]).toEqual(['john doe']);
    });

    it('provides debounced search to avoid excessive filtering', () => {
      // Arrange: Admin is typing quickly in search
      const wrapper = mount(
        UserSearchFilters,
        withQuasarBrowser({
          props: sampleProps,
        }),
      );

      // Assert: Search input has debounce for better performance
      const searchInput = wrapper.findComponent({ name: 'QInput' });
      expect(searchInput.props('debounce')).toBe('300');

      // Behavior: User sees search icon indicating search functionality
      expect(wrapper.html()).toMatch(/search|icon.*search/i);
    });

    it('allows filtering users by role', async () => {
      // Arrange: Admin wants to see only educators
      const wrapper = mount(
        UserSearchFilters,
        withQuasarBrowser({
          props: sampleProps,
        }),
      );

      // Act: Admin selects role filter
      const selects = wrapper.findAllComponents({ name: 'QSelect' });
      const roleSelect = selects.find((select) =>
        select.props('options')?.includes('Administrator'),
      );

      expect(roleSelect?.exists()).toBe(true);
      await roleSelect?.vm.$emit('update:modelValue', 'Educator');

      // Assert: Role filter is applied
      expect(wrapper.emitted('update:roleFilter')).toBeTruthy();
      expect(wrapper.emitted('update:roleFilter')?.[0]).toEqual(['Educator']);
    });

    it('allows filtering users by status', async () => {
      // Arrange: Admin wants to see only active users
      const wrapper = mount(
        UserSearchFilters,
        withQuasarBrowser({
          props: sampleProps,
        }),
      );

      // Act: Admin selects status filter
      const selects = wrapper.findAllComponents({ name: 'QSelect' });
      const statusSelect = selects.find((select) => select.props('options')?.includes('Active'));

      expect(statusSelect?.exists()).toBe(true);
      await statusSelect?.vm.$emit('update:modelValue', 'Active');

      // Assert: Status filter is applied
      expect(wrapper.emitted('update:statusFilter')).toBeTruthy();
      expect(wrapper.emitted('update:statusFilter')?.[0]).toEqual(['Active']);
    });

    it('allows clearing filters to show all users', async () => {
      // Arrange: Admin has applied filters and wants to see all users
      const propsWithFilters = {
        ...sampleProps,
        search: 'existing search',
        roleFilter: 'Educator',
        statusFilter: 'Active',
      };

      const wrapper = mount(
        UserSearchFilters,
        withQuasarBrowser({
          props: propsWithFilters,
        }),
      );

      // Assert: Admin can see current filters are applied
      const searchInput = wrapper.findComponent({ name: 'QInput' });
      expect(searchInput.props('modelValue')).toBe('existing search');

      // Behavior: Select filters show clearable option
      const selects = wrapper.findAllComponents({ name: 'QSelect' });
      selects.forEach((select) => {
        expect(select.props('clearable')).toBe(true);
      });

      // Act: Admin clears search
      await searchInput.vm.$emit('update:modelValue', '');

      // Assert: Search is cleared
      expect(wrapper.emitted('update:search')).toBeTruthy();
      const searchEmissions = wrapper.emitted('update:search') as string[][];
      expect(searchEmissions[searchEmissions.length - 1]).toEqual(['']);
    });
  });

  describe('When working with different system configurations', () => {
    it('adapts to available role options in the system', () => {
      // Arrange: System with custom role configuration
      const customRoleProps = {
        ...sampleProps,
        roleOptions: ['Manager', 'Employee'],
        statusOptions: ['Active'],
      };

      // Act: Render with custom roles
      const wrapper = mount(
        UserSearchFilters,
        withQuasarBrowser({
          props: customRoleProps,
        }),
      );

      // Assert: Admin sees only available roles for their system
      const selects = wrapper.findAllComponents({ name: 'QSelect' });
      const roleSelect = selects.find((select) => select.props('options')?.includes('Manager'));

      expect(roleSelect?.exists()).toBe(true);
      expect(roleSelect?.props('options')).toEqual(['Manager', 'Employee']);
    });

    it('handles systems with no role/status categories', () => {
      // Arrange: Simple system with minimal categories
      const minimalProps = {
        search: '',
        roleFilter: null,
        statusFilter: null,
        roleOptions: [],
        statusOptions: [],
      };

      // Act: Render with minimal options
      const wrapper = mount(
        UserSearchFilters,
        withQuasarBrowser({
          props: minimalProps,
        }),
      );

      // Assert: Admin still has search functionality
      const searchInput = wrapper.findComponent({ name: 'QInput' });
      expect(searchInput.exists()).toBe(true);

      // Behavior: Filter selects are present but empty (graceful degradation)
      const selects = wrapper.findAllComponents({ name: 'QSelect' });
      expect(selects.length).toBe(2);
    });

    it('preserves admin filter state during navigation', () => {
      // Arrange: Admin returns to page with saved filter state
      const savedFilterState = {
        search: 'previous search',
        roleFilter: 'Administrator',
        statusFilter: 'Inactive',
        roleOptions: sampleProps.roleOptions,
        statusOptions: sampleProps.statusOptions,
      };

      // Act: Render with preserved state
      const wrapper = mount(
        UserSearchFilters,
        withQuasarBrowser({
          props: savedFilterState,
        }),
      );

      // Assert: Admin sees their previous filter state
      const searchInput = wrapper.findComponent({ name: 'QInput' });
      expect(searchInput.props('modelValue')).toBe('previous search');

      // Find and verify role and status selects maintain state
      const selects = wrapper.findAllComponents({ name: 'QSelect' });
      const roleSelect = selects.find((select) => select.props('modelValue') === 'Administrator');
      const statusSelect = selects.find((select) => select.props('modelValue') === 'Inactive');

      expect(roleSelect?.exists()).toBe(true);
      expect(statusSelect?.exists()).toBe(true);
    });
  });

  describe('User Interface and Accessibility', () => {
    it('provides clear labels and placeholders for all inputs', () => {
      // Arrange: Admin needs intuitive interface
      const wrapper = mount(
        UserSearchFilters,
        withQuasarBrowser({
          props: sampleProps,
        }),
      );

      // Assert: Search input has helpful interface for user input
      const searchInput = wrapper.findComponent({ name: 'QInput' });
      // Behavior: Search input exists and is configured for user interaction
      expect(searchInput.exists()).toBe(true);
      expect(searchInput.props('filled')).toBe(true);

      // Assert: Select fields have descriptive labels
      const selects = wrapper.findAllComponents({ name: 'QSelect' });
      selects.forEach((select) => {
        expect(select.props()).toHaveProperty('label');
      });
    });

    it('organizes filters in logical visual hierarchy', () => {
      // Arrange: Admin needs efficient workflow
      const wrapper = mount(
        UserSearchFilters,
        withQuasarBrowser({
          props: sampleProps,
        }),
      );

      // Assert: Filters are arranged horizontally with consistent spacing
      const container = wrapper.find('.row');
      expect(container.exists()).toBe(true);
      expect(container.classes()).toContain('q-gutter-md');

      // Behavior: Search comes first (most common action), then filters
      const searchInput = wrapper.findComponent({ name: 'QInput' });
      const selects = wrapper.findAllComponents({ name: 'QSelect' });
      expect(searchInput.exists()).toBe(true);
      expect(selects.length).toBe(2);
    });

    it('provides visual feedback for active filters', () => {
      // Arrange: Admin needs to see which filters are active
      const activeFiltersProps = {
        search: 'active search',
        roleFilter: 'Administrator',
        statusFilter: 'Active',
        roleOptions: sampleProps.roleOptions,
        statusOptions: sampleProps.statusOptions,
      };

      // Act: Render with active filters
      const wrapper = mount(
        UserSearchFilters,
        withQuasarBrowser({
          props: activeFiltersProps,
        }),
      );

      // Assert: Admin can see which filters are currently applied
      const searchInput = wrapper.findComponent({ name: 'QInput' });
      expect(searchInput.props('modelValue')).toBe('active search');

      // Behavior: Active filter values are visible in the interface
      const selects = wrapper.findAllComponents({ name: 'QSelect' });
      const activeSelects = selects.filter((select) => select.props('modelValue') !== null);
      expect(activeSelects.length).toBeGreaterThan(0);
    });

    it('maintains responsive layout for mobile admin access', () => {
      // Arrange: Admin using mobile device
      const wrapper = mount(
        UserSearchFilters,
        withQuasarBrowser({
          props: sampleProps,
        }),
      );

      // Assert: Layout adapts to smaller screens
      const container = wrapper.find('.row');
      expect(container.exists()).toBe(true);

      // Behavior: Components have defined widths for consistent layout
      const searchInput = wrapper.findComponent({ name: 'QInput' });
      expect(searchInput.attributes('style')).toMatch(/width/);
    });
  });
});
