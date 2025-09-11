import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UserActionBar from '../../../src/components/admin/UserActionBar.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('UserActionBar Component', () => {
  const defaultProps = {
    search: '',
    roleFilter: null,
    statusFilter: null,
    roleOptions: ['Administrator', 'Educator', 'Student'],
    statusOptions: ['Active', 'Inactive'],
  };

  it('should render with all props', () => {
    const wrapper = mount(
      UserActionBar,
      withQuasarBrowser({
        props: defaultProps,
      }),
    );

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'UserSearchFilters' }).exists()).toBe(true);
  });

  it('should render UserSearchFilters component with correct props', () => {
    const props = {
      search: 'test search',
      roleFilter: 'Administrator',
      statusFilter: 'Active',
      roleOptions: ['Administrator', 'Educator'],
      statusOptions: ['Active', 'Inactive'],
    };

    const wrapper = mount(
      UserActionBar,
      withQuasarBrowser({
        props,
      }),
    );

    const searchFilters = wrapper.findComponent({ name: 'UserSearchFilters' });
    expect(searchFilters.exists()).toBe(true);
    expect(searchFilters.props('search')).toBe(props.search);
    expect(searchFilters.props('roleFilter')).toBe(props.roleFilter);
    expect(searchFilters.props('statusFilter')).toBe(props.statusFilter);
  });

  it('should render action buttons with correct labels', () => {
    const wrapper = mount(
      UserActionBar,
      withQuasarBrowser({
        props: defaultProps,
      }),
    );

    // Check for buttons in the button group
    const buttons = wrapper.findAll('.q-btn');
    expect(buttons.length).toBeGreaterThanOrEqual(2);

    // Check content includes expected text (from i18n)
    const buttonTexts = buttons.map((btn) => btn.text()).join(' ');
    expect(buttonTexts).toContain('Add User');
    expect(buttonTexts).toContain('Bulk Import');
  });

  it('should emit add-user event when add user button is clicked', async () => {
    const wrapper = mount(
      UserActionBar,
      withQuasarBrowser({
        props: defaultProps,
      }),
    );

    // Find the first button (add user button)
    const buttons = wrapper.findAll('.q-btn');
    expect(buttons.length).toBeGreaterThan(0);

    const addUserButton = buttons[0];
    if (addUserButton) {
      await addUserButton.trigger('click');
      expect(wrapper.emitted('add-user')).toBeTruthy();
    }
  });

  it('should emit bulk-import event when bulk import button is clicked', async () => {
    const wrapper = mount(
      UserActionBar,
      withQuasarBrowser({
        props: defaultProps,
      }),
    );

    // Find the second button (bulk import button)
    const buttons = wrapper.findAll('.q-btn');
    expect(buttons.length).toBeGreaterThan(1);

    const bulkImportButton = buttons[1];
    if (bulkImportButton) {
      await bulkImportButton.trigger('click');
      expect(wrapper.emitted('bulk-import')).toBeTruthy();
    }
  });

  it('should emit update events from UserSearchFilters', async () => {
    const wrapper = mount(
      UserActionBar,
      withQuasarBrowser({
        props: defaultProps,
      }),
    );

    const searchFilters = wrapper.findComponent({ name: 'UserSearchFilters' });

    // Emit search update
    await searchFilters.vm.$emit('update:search', 'new search');
    expect(wrapper.emitted('update:search')).toBeTruthy();
    expect(wrapper.emitted('update:search')?.[0]).toEqual(['new search']);

    // Emit role filter update
    await searchFilters.vm.$emit('update:roleFilter', 'Educator');
    expect(wrapper.emitted('update:roleFilter')).toBeTruthy();
    expect(wrapper.emitted('update:roleFilter')?.[0]).toEqual(['Educator']);

    // Emit status filter update
    await searchFilters.vm.$emit('update:statusFilter', 'Inactive');
    expect(wrapper.emitted('update:statusFilter')).toBeTruthy();
    expect(wrapper.emitted('update:statusFilter')?.[0]).toEqual(['Inactive']);
  });

  it('should have proper layout structure', () => {
    const wrapper = mount(
      UserActionBar,
      withQuasarBrowser({
        props: defaultProps,
      }),
    );

    const row = wrapper.find('.row');
    expect(row.exists()).toBe(true);
    expect(row.classes()).toContain('justify-between');
    expect(row.classes()).toContain('items-center');

    // Check for button group component
    const btnGroup = wrapper.findComponent({ name: 'QBtnGroup' });
    expect(btnGroup.exists()).toBe(true);
  });

  it('should handle null filter values', () => {
    const props = {
      search: '',
      roleFilter: null,
      statusFilter: null,
      roleOptions: [],
      statusOptions: [],
    };

    const wrapper = mount(
      UserActionBar,
      withQuasarBrowser({
        props,
      }),
    );

    expect(wrapper.exists()).toBe(true);
    const searchFilters = wrapper.findComponent({ name: 'UserSearchFilters' });
    expect(searchFilters.props('roleFilter')).toBeNull();
    expect(searchFilters.props('statusFilter')).toBeNull();
  });
});
