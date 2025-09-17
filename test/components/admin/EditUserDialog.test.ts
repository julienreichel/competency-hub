import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import EditUserDialog from '../../../src/components/admin/EditUserDialog.vue';
import { UserRole } from '../../../src/models/User';
import { withQuasarBrowser } from '../../browser-test-utils';

const baseUser = {
  id: 'user-1',
  name: 'Alice Doe',
  email: 'alice@example.com',
  role: UserRole.STUDENT,
  avatar: null,
  contactInfo: 'Reach me at alice@example.com',
};

describe('EditUserDialog - User Behavior', () => {
  it('shows current user information for context', () => {
    const wrapper = mount(
      EditUserDialog,
      withQuasarBrowser({
        props: {
          modelValue: true,
          user: baseUser,
          roleOptions: [UserRole.STUDENT, UserRole.EDUCATOR],
        },
      }),
    );

    // Find all q-input input fields and check their values by order
    const inputComps = wrapper.findAllComponents({ name: 'QInput' });
    expect(inputComps.length).toBeGreaterThanOrEqual(2);
    if (inputComps.length >= 2) {
      const nameInput = inputComps[0]?.find('input');
      const emailInput = inputComps[1]?.find('input');
      expect(nameInput?.exists()).toBe(true);
      expect(emailInput?.exists()).toBe(true);
      if (nameInput?.exists() && emailInput?.exists()) {
        expect((nameInput.element as HTMLInputElement).value).toBe(baseUser.name);
        expect((emailInput.element as HTMLInputElement).value).toBe(baseUser.email);
      }
    }
  });
});
