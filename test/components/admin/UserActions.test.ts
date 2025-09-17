import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UserActions from '../../../src/components/admin/UserActions.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('UserActions - User Behavior', () => {
  const sampleUser = {
    id: '1',
    name: 'John Doe',
    role: 'Administrator',
    email: 'john.doe@example.com',
    avatar: '',
    contactInfo: '',
  };

  describe('Primary actions', () => {
    it('emits view event when profile action is triggered', async () => {
      const wrapper = mount(UserActions, withQuasarBrowser({ props: { user: sampleUser } }));
      await wrapper.vm.$nextTick();

      const viewButton = wrapper.find('[data-testid="user-actions-view"]');
      expect(viewButton.exists()).toBe(true);

      await viewButton.trigger('click');

      expect(wrapper.emitted('view')).toBeTruthy();
      expect(wrapper.emitted('view')?.[0]).toEqual([sampleUser]);
    });

    it('emits edit event when edit action is triggered', async () => {
      const wrapper = mount(UserActions, withQuasarBrowser({ props: { user: sampleUser } }));
      await wrapper.vm.$nextTick();

      const editButton = wrapper.find('[data-testid="user-actions-edit"]');
      expect(editButton.exists()).toBe(true);

      await editButton.trigger('click');

      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('edit')?.[0]).toEqual([sampleUser]);
    });
  });
});
