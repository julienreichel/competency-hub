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

      const viewButton = wrapper.find('.q-btn');
      expect(viewButton.exists()).toBe(true);

      await viewButton.trigger('click');

      expect(wrapper.emitted('view')).toBeTruthy();
      expect(wrapper.emitted('view')?.[0]).toEqual([sampleUser]);
    });

    it('emits edit event when edit action is triggered', async () => {
      const wrapper = mount(UserActions, withQuasarBrowser({ props: { user: sampleUser } }));

      const buttons = wrapper.findAll('.q-btn');
      expect(buttons.length).toBeGreaterThan(1);

      await buttons[1]?.trigger('click');

      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('edit')?.[0]).toEqual([sampleUser]);
    });
  });

  describe('Secondary menu', () => {
    it('exposes activity view option through menu', async () => {
      const wrapper = mount(UserActions, withQuasarBrowser({ props: { user: sampleUser } }));

      const menuButton = wrapper.findAll('.q-btn')[2];
      expect(menuButton).toBeDefined();

      await menuButton?.trigger('click');
      await wrapper.findComponent({ name: 'QItem' }).trigger('click');

      expect(wrapper.emitted('view-activity')).toBeTruthy();
      expect(wrapper.emitted('view-activity')?.[0]).toEqual([sampleUser]);
    });

    it('keeps actions grouped for accessibility', () => {
      const wrapper = mount(UserActions, withQuasarBrowser({ props: { user: sampleUser } }));

      expect(wrapper.find('.q-btn-group').exists()).toBe(true);
    });
  });
});
