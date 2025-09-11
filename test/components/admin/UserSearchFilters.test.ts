import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UserSearchFilters from '../../../src/components/admin/UserSearchFilters.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('UserSearchFilters Component', () => {
  const defaultProps = {
    search: '',
    roleFilter: null,
    statusFilter: null,
    roleOptions: ['Administrator', 'Educator', 'Student'],
    statusOptions: ['Active', 'Inactive'],
  };

  it('should render with all props', () => {
    const wrapper = mount(
      UserSearchFilters,
      withQuasarBrowser({
        props: defaultProps,
      }),
    );

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'QInput' }).exists()).toBe(true);
    expect(wrapper.findAllComponents({ name: 'QSelect' }).length).toBe(2);
  });

  it('should render search input with correct properties', () => {
    const wrapper = mount(
      UserSearchFilters,
      withQuasarBrowser({
        props: {
          ...defaultProps,
          search: 'test search',
        },
      }),
    );

    const searchInput = wrapper.findComponent({ name: 'QInput' });
    expect(searchInput.exists()).toBe(true);
    expect(searchInput.props('modelValue')).toBe('test search');
    expect(searchInput.props('filled')).toBe(true);
    expect(searchInput.props('debounce')).toBe('300');
  });

  it('should render role select with correct options', () => {
    const roleOptions = ['Student', 'Educator', 'Parent', 'Admin'];
    const wrapper = mount(
      UserSearchFilters,
      withQuasarBrowser({
        props: {
          ...defaultProps,
          roleFilter: 'Student',
          roleOptions,
        },
      }),
    );

    const selects = wrapper.findAllComponents({ name: 'QSelect' });
    const roleSelect = selects[0]; // First select is role
    if (roleSelect) {
      expect(roleSelect.props('modelValue')).toBe('Student');
      expect(roleSelect.props('options')).toEqual(roleOptions);
    }
  });

  it('should render status select with correct options', () => {
    const statusOptions = ['Active', 'Inactive', 'Suspended'];
    const wrapper = mount(
      UserSearchFilters,
      withQuasarBrowser({
        props: {
          ...defaultProps,
          statusFilter: 'Active',
          statusOptions,
        },
      }),
    );

    const selects = wrapper.findAllComponents({ name: 'QSelect' });
    const statusSelect = selects[1]; // Second select is status
    if (statusSelect) {
      expect(statusSelect.props('modelValue')).toBe('Active');
      expect(statusSelect.props('options')).toEqual(statusOptions);
    }
  });

  it('should emit update:search when search input changes', async () => {
    const wrapper = mount(
      UserSearchFilters,
      withQuasarBrowser({
        props: defaultProps,
      }),
    );

    const searchInput = wrapper.findComponent({ name: 'QInput' });
    await searchInput.vm.$emit('update:modelValue', 'new search');

    expect(wrapper.emitted('update:search')).toBeTruthy();
    expect(wrapper.emitted('update:search')?.[0]).toEqual(['new search']);
  });

  it('should emit update:roleFilter when role select changes', async () => {
    const wrapper = mount(
      UserSearchFilters,
      withQuasarBrowser({
        props: defaultProps,
      }),
    );

    const selects = wrapper.findAllComponents({ name: 'QSelect' });
    const roleSelect = selects[0];
    if (roleSelect) {
      await roleSelect.vm.$emit('update:modelValue', 'Administrator');

      expect(wrapper.emitted('update:roleFilter')).toBeTruthy();
      expect(wrapper.emitted('update:roleFilter')?.[0]).toEqual(['Administrator']);
    }
  });

  it('should emit update:statusFilter when status select changes', async () => {
    const wrapper = mount(
      UserSearchFilters,
      withQuasarBrowser({
        props: defaultProps,
      }),
    );

    const selects = wrapper.findAllComponents({ name: 'QSelect' });
    const statusSelect = selects[1];
    if (statusSelect) {
      await statusSelect.vm.$emit('update:modelValue', 'Inactive');

      expect(wrapper.emitted('update:statusFilter')).toBeTruthy();
      expect(wrapper.emitted('update:statusFilter')?.[0]).toEqual(['Inactive']);
    }
  });

  it('should have correct styling and layout', () => {
    const wrapper = mount(
      UserSearchFilters,
      withQuasarBrowser({
        props: defaultProps,
      }),
    );

    const row = wrapper.find('.row');
    expect(row.exists()).toBe(true);
    expect(row.classes()).toContain('q-gutter-md');

    const searchInput = wrapper.findComponent({ name: 'QInput' });
    expect(searchInput.props('filled')).toBe(true);

    const selects = wrapper.findAllComponents({ name: 'QSelect' });
    selects.forEach((select) => {
      expect(select.props('filled')).toBe(true);
    });
  });

  it('should show search icon in input', () => {
    const wrapper = mount(
      UserSearchFilters,
      withQuasarBrowser({
        props: defaultProps,
      }),
    );

    // Check for search icon in the input
    const searchIcon = wrapper.findComponent({ name: 'QIcon' });
    expect(searchIcon.exists()).toBe(true);
  });

  it('should handle null filter values', () => {
    const wrapper = mount(
      UserSearchFilters,
      withQuasarBrowser({
        props: {
          search: '',
          roleFilter: null,
          statusFilter: null,
          roleOptions: ['Administrator'],
          statusOptions: ['Active'],
        },
      }),
    );

    const selects = wrapper.findAllComponents({ name: 'QSelect' });
    if (selects.length >= 2 && selects[0] && selects[1]) {
      expect(selects[0].props('modelValue')).toBeNull();
      expect(selects[1].props('modelValue')).toBeNull();
    }
  });

  it('should handle empty arrays for options', () => {
    const wrapper = mount(
      UserSearchFilters,
      withQuasarBrowser({
        props: {
          search: '',
          roleFilter: null,
          statusFilter: null,
          roleOptions: [],
          statusOptions: [],
        },
      }),
    );

    const selects = wrapper.findAllComponents({ name: 'QSelect' });
    if (selects.length >= 2 && selects[0] && selects[1]) {
      expect(selects[0].props('options')).toEqual([]);
      expect(selects[1].props('options')).toEqual([]);
    }
  });

  it('should have proper component structure', () => {
    const wrapper = mount(
      UserSearchFilters,
      withQuasarBrowser({
        props: defaultProps,
      }),
    );

    // Should have one input and two selects
    expect(wrapper.findComponent({ name: 'QInput' }).exists()).toBe(true);
    expect(wrapper.findAllComponents({ name: 'QSelect' }).length).toBe(2);

    // Should have search icon
    expect(wrapper.findComponent({ name: 'QIcon' }).exists()).toBe(true);
  });
});
