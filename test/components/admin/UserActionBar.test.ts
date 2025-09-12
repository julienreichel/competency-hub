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

    it('allows adding new users to the system', async () => {
      // Arrange: Admin wants to add a new user
      const wrapper = mount(
        UserActionBar,
        withQuasarBrowser({
          props: sampleProps,
        }),
      );

      // Act: Admin clicks add user action
      const addUserButton = wrapper.find(
        '[data-testid="add-user"], .q-btn:has([data-cy="person_add"]), .q-btn:first-child',
      );
      if (!addUserButton.exists()) {
        // Fallback: Find button with add user text or icon
        const buttons = wrapper.findAll('.q-btn');
        const addButton = buttons.find(
          (btn) => btn.text().toLowerCase().includes('add') || btn.html().includes('person_add'),
        );
        expect(addButton?.exists()).toBe(true);
        await addButton?.trigger('click');
      } else {
        await addUserButton.trigger('click');
      }

      // Assert: System receives intent to add user
      expect(wrapper.emitted('add-user')).toBeTruthy();
    });

    it('enables bulk import of multiple users', async () => {
      // Arrange: Admin wants to import multiple users at once
      const wrapper = mount(
        UserActionBar,
        withQuasarBrowser({
          props: sampleProps,
        }),
      );

      // Act: Admin clicks bulk import action
      const bulkImportButton = wrapper.find(
        '[data-testid="bulk-import"], .q-btn:has([data-cy="file_upload"])',
      );
      if (!bulkImportButton.exists()) {
        // Fallback: Find button with import text or icon
        const buttons = wrapper.findAll('.q-btn');
        const importButton = buttons.find(
          (btn) =>
            btn.text().toLowerCase().includes('import') ||
            btn.text().toLowerCase().includes('bulk') ||
            btn.html().includes('file_upload'),
        );
        expect(importButton?.exists()).toBe(true);
        await importButton?.trigger('click');
      } else {
        await bulkImportButton.trigger('click');
      }

      // Assert: System receives intent to bulk import
      expect(wrapper.emitted('bulk-import')).toBeTruthy();
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

      // Behavior: Action buttons remain available regardless of filter options
      const buttons = wrapper.findAll('.q-btn');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
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
      const buttonGroup = wrapper.findComponent({ name: 'QBtnGroup' });
      expect(searchFilters.exists()).toBe(true);
      expect(buttonGroup.exists()).toBe(true);
    });

    it('provides clear visual hierarchy for admin actions', () => {
      // Arrange: Admin needs to quickly identify available actions
      const wrapper = mount(
        UserActionBar,
        withQuasarBrowser({
          props: sampleProps,
        }),
      );

      // Assert: Action buttons are visually distinct and grouped
      const buttonGroup = wrapper.findComponent({ name: 'QBtnGroup' });
      expect(buttonGroup.exists()).toBe(true);

      // Behavior: Multiple action buttons are grouped for better UX
      const buttons = wrapper.findAll('.q-btn');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
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
