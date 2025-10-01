import type { VueWrapper } from '@vue/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { ComponentPublicInstance } from 'vue';
import UserDetailsDialog from '../../../src/components/ui/UserDetailsDialog.vue';
import { UserRole } from '../../../src/models/User';
import { withQuasarBrowser } from '../../browser-test-utils';

const buildWrapper = (
  overrides: Partial<{ modelValue: boolean }> = {},
): VueWrapper<ComponentPublicInstance> =>
  mount(
    UserDetailsDialog,
    withQuasarBrowser({
      props: {
        modelValue: true,
        user: {
          id: 'user-1',
          name: 'Alice Doe',
          email: 'alice@example.com',
          role: UserRole.STUDENT,
          contactInfo: 'Reach me at alice@example.com',
          lastActive: new Date().toISOString(),
          createdAt: '2024-01-01T00:00:00.000Z',
          avatar: null,
        },
        ...overrides,
      },
    }),
  );

describe('UserDetailsDialog - User Behavior', () => {
  it('displays key user information for quick review', () => {
    const wrapper = buildWrapper();
    const text = wrapper.text();

    expect(text).toContain('Alice Doe');
    expect(text).toContain('alice@example.com');
    expect(text).toContain(UserRole.STUDENT);
    expect(text).toContain('Reach me at alice@example.com');
  });

  it('handles missing optional fields gracefully', () => {
    const wrapper = mount(
      UserDetailsDialog,
      withQuasarBrowser({
        props: {
          modelValue: true,
          user: {
            id: 'user-2',
            name: 'Bob Smith',
            email: 'bob@example.com',
            role: UserRole.EDUCATOR,
            avatar: null,
          },
        },
      }),
    );

    const text = wrapper.text();
    expect(text).toContain('Bob Smith');
    expect(text).toContain('bob@example.com');
  });
});
