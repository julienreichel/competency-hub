import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UserActionBar from '../../../src/components/admin/UserActionBar.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('UserActionBar - User Behavior', () => {
  const sampleProps = {
    search: '',
    roleFilter: null,
    roleOptions: ['Administrator', 'Educator', 'Student', 'Parent'],
  };

  describe('When admin needs to manage users', () => {
    it('provides user search and role filtering capabilities', () => {
      const wrapper = mount(UserActionBar, withQuasarBrowser({ props: sampleProps }));

      const searchFilters = wrapper.findComponent({ name: 'UserSearchFilters' });
      expect(searchFilters.exists()).toBe(true);
      expect(searchFilters.props()).toMatchObject({
        search: '',
        roleFilter: null,
        roleOptions: sampleProps.roleOptions,
      });
    });

    it('propagates filter changes to parent component', async () => {
      const wrapper = mount(UserActionBar, withQuasarBrowser({ props: sampleProps }));

      const searchFilters = wrapper.findComponent({ name: 'UserSearchFilters' });

      await searchFilters.vm.$emit('update:search', 'john doe');
      await searchFilters.vm.$emit('update:roleFilter', 'Administrator');

      expect(wrapper.emitted('update:search')).toBeTruthy();
      expect(wrapper.emitted('update:search')?.[0]).toEqual(['john doe']);
      expect(wrapper.emitted('update:roleFilter')).toBeTruthy();
      expect(wrapper.emitted('update:roleFilter')?.[0]).toEqual(['Administrator']);
    });
  });

  describe('When handling different admin scenarios', () => {
    it('works with pre-existing search criteria', () => {
      const propsWithFilters = {
        search: 'existing search',
        roleFilter: 'Educator',
        roleOptions: ['Administrator', 'Educator'],
      };

      const wrapper = mount(UserActionBar, withQuasarBrowser({ props: propsWithFilters }));

      const searchFilters = wrapper.findComponent({ name: 'UserSearchFilters' });
      expect(searchFilters.props('search')).toBe('existing search');
      expect(searchFilters.props('roleFilter')).toBe('Educator');
    });

    it('handles limited role options gracefully', () => {
      const limitedProps = {
        search: '',
        roleFilter: null,
        roleOptions: [],
      };

      const wrapper = mount(UserActionBar, withQuasarBrowser({ props: limitedProps }));

      const searchFilters = wrapper.findComponent({ name: 'UserSearchFilters' });
      expect(searchFilters.exists()).toBe(true);
    });
  });

  describe('Layout and User Experience', () => {
    it('organizes controls in a logical admin workflow', () => {
      const wrapper = mount(UserActionBar, withQuasarBrowser({ props: sampleProps }));

      const container = wrapper.find('.row');
      expect(container.exists()).toBe(true);
      expect(container.classes()).toContain('justify-between');

      const searchFilters = wrapper.findComponent({ name: 'UserSearchFilters' });
      expect(searchFilters.exists()).toBe(true);
    });

    it('focuses layout on filter controls', () => {
      const wrapper = mount(UserActionBar, withQuasarBrowser({ props: sampleProps }));

      const searchFilters = wrapper.findComponent({ name: 'UserSearchFilters' });
      expect(searchFilters.exists()).toBe(true);
      expect(wrapper.findAll('.q-btn').length).toBe(0);
    });

    it('maintains responsive layout for different screen sizes', () => {
      const wrapper = mount(UserActionBar, withQuasarBrowser({ props: sampleProps }));

      const container = wrapper.find('.row');
      expect(container.classes()).toContain('items-center');
      expect(container.classes()).toContain('q-mb-lg');
    });
  });
});
