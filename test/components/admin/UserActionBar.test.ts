import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UserActionBar from '../../../src/components/admin/UserActionBar.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('UserActionBar - User Behavior', () => {
  const sampleProps = {
    search: '',
    roleFilter: null,
    statusFilter: null,
    roleOptions: ['Administrator', 'Educator', 'Student', 'Parent'],
    statusOptions: ['Active', 'Inactive', 'Suspended'],
  };

  describe('When admin needs to manage users', () => {
    it('provides user search and filtering capabilities', () => {
      // Arrange: Admin wants to find specific users
      const wrapper = mount(
        UserActionBar,
        withQuasarBrowser({
          props: sampleProps,
        }),
      );

      // Assert: Admin can see search and filter interface
      const searchFilters = wrapper.findComponent({ name: 'UserSearchFilters' });
      expect(searchFilters.exists()).toBe(true);

      // Behavior: Search interface is accessible and functional
      expect(searchFilters.props()).toMatchObject({
        search: '',
        roleFilter: null,
        statusFilter: null,
        roleOptions: sampleProps.roleOptions,
        statusOptions: sampleProps.statusOptions,
      });
    });

    it('propagates search filter changes to parent', async () => {
      // Arrange: Admin is using search filters
      const wrapper = mount(
        UserActionBar,
        withQuasarBrowser({
          props: sampleProps,
        }),
      );

      const searchFilters = wrapper.findComponent({ name: 'UserSearchFilters' });

      // Act: Admin updates search criteria
      await searchFilters.vm.$emit('update:search', 'john doe');
      await searchFilters.vm.$emit('update:roleFilter', 'Administrator');
      await searchFilters.vm.$emit('update:statusFilter', 'Active');

      // Assert: Parent component receives filter updates
      expect(wrapper.emitted('update:search')).toBeTruthy();
      expect(wrapper.emitted('update:search')?.[0]).toEqual(['john doe']);

      expect(wrapper.emitted('update:roleFilter')).toBeTruthy();
      expect(wrapper.emitted('update:roleFilter')?.[0]).toEqual(['Administrator']);

      expect(wrapper.emitted('update:statusFilter')).toBeTruthy();
      expect(wrapper.emitted('update:statusFilter')?.[0]).toEqual(['Active']);
    });
  });

  describe('When handling different admin scenarios', () => {
    it('works with pre-existing search criteria', () => {
      // Arrange: Admin returns to page with existing filters
      const propsWithFilters = {
        search: 'existing search',
        roleFilter: 'Educator',
        statusFilter: 'Active',
        roleOptions: ['Administrator', 'Educator'],
        statusOptions: ['Active', 'Inactive'],
      };

      // Act: Render with existing filters
      const wrapper = mount(
        UserActionBar,
        withQuasarBrowser({
          props: propsWithFilters,
        }),
      );

      // Assert: Admin sees their previous search state preserved
      const searchFilters = wrapper.findComponent({ name: 'UserSearchFilters' });
      expect(searchFilters.props('search')).toBe('existing search');
      expect(searchFilters.props('roleFilter')).toBe('Educator');
      expect(searchFilters.props('statusFilter')).toBe('Active');
    });

    it('handles empty or limited filter options gracefully', () => {
      // Arrange: System with limited roles/statuses
      const limitedProps = {
        search: '',
        roleFilter: null,
        statusFilter: null,
        roleOptions: [],
        statusOptions: ['Active'],
      };

      // Act: Render with limited options
      const wrapper = mount(
        UserActionBar,
        withQuasarBrowser({
          props: limitedProps,
        }),
      );

      // Assert: Admin still has access to core functionality
      const searchFilters = wrapper.findComponent({ name: 'UserSearchFilters' });
      expect(searchFilters.exists()).toBe(true);
    });
  });

  describe('Layout and User Experience', () => {
    it('organizes controls in a logical admin workflow', () => {
      // Arrange: Admin needs intuitive interface layout
      const wrapper = mount(
        UserActionBar,
        withQuasarBrowser({
          props: sampleProps,
        }),
      );

      // Assert: Controls are logically organized
      // Behavior: Search/filter on left, actions on right
      const container = wrapper.find('.row');
      expect(container.exists()).toBe(true);
      expect(container.classes()).toContain('justify-between');

      // Behavior: Visual separation between filter and action areas
      const searchFilters = wrapper.findComponent({ name: 'UserSearchFilters' });
      expect(searchFilters.exists()).toBe(true);
    });

    it('provides clear visual hierarchy for admin actions', () => {
      // Arrange: Admin needs to quickly identify available actions
      const wrapper = mount(
        UserActionBar,
        withQuasarBrowser({
          props: sampleProps,
        }),
      );

      // Assert: Layout focuses on filter controls for clarity
      const searchFilters = wrapper.findComponent({ name: 'UserSearchFilters' });
      expect(searchFilters.exists()).toBe(true);
      // No additional action buttons are shown in MVP
      expect(wrapper.findAll('.q-btn').length).toBe(0);
    });

    it('maintains responsive layout for different screen sizes', () => {
      // Arrange: Admin using interface on different devices
      const wrapper = mount(
        UserActionBar,
        withQuasarBrowser({
          props: sampleProps,
        }),
      );

      // Assert: Layout uses responsive classes
      const container = wrapper.find('.row');
      expect(container.classes()).toContain('items-center');

      // Behavior: Content is spaced appropriately
      expect(container.classes()).toContain('q-mb-lg');
    });
  });
});
