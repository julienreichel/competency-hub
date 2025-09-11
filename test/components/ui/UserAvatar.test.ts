import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UserAvatar from '../../../src/components/ui/UserAvatar.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('UserAvatar Component', () => {
  it('should render user initials when no avatar provided', () => {
    const wrapper = mount(
      UserAvatar,
      withQuasarBrowser({
        props: {
          user: {
            name: 'John Doe',
          },
        },
      }),
    );

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('span').text()).toBe('JD');
  });

  it('should render avatar image when provided', () => {
    const wrapper = mount(
      UserAvatar,
      withQuasarBrowser({
        props: {
          user: {
            name: 'Jane Smith',
            avatar: 'https://example.com/avatar.jpg',
          },
        },
      }),
    );

    // Check that q-img element exists in the HTML
    expect(wrapper.html()).toContain('q-img');
    expect(wrapper.html()).toContain('https://example.com/avatar.jpg');

    // Should not show initials when avatar is present
    expect(wrapper.find('span').exists()).toBe(false);
  });

  it('should use default size when not specified', () => {
    const wrapper = mount(
      UserAvatar,
      withQuasarBrowser({
        props: {
          user: {
            name: 'Test User',
          },
        },
      }),
    );

    // Check that q-avatar element exists in the HTML
    expect(wrapper.html()).toContain('q-avatar');
    expect(wrapper.html()).toContain('40px'); // default size
  });

  it('should use custom size when provided', () => {
    const wrapper = mount(
      UserAvatar,
      withQuasarBrowser({
        props: {
          user: {
            name: 'Test User',
          },
          size: '60px',
        },
      }),
    );

    // Check that q-avatar element exists with custom size
    expect(wrapper.html()).toContain('q-avatar');
    expect(wrapper.html()).toContain('60px');
  });

  it('should generate correct initials for single name', () => {
    const wrapper = mount(
      UserAvatar,
      withQuasarBrowser({
        props: {
          user: {
            name: 'Madonna',
          },
        },
      }),
    );

    expect(wrapper.find('span').text()).toBe('M');
  });

  it('should generate correct initials for multiple names', () => {
    const wrapper = mount(
      UserAvatar,
      withQuasarBrowser({
        props: {
          user: {
            name: 'Mary Jane Watson',
          },
        },
      }),
    );

    expect(wrapper.find('span').text()).toBe('MJW');
  });

  it('should handle names with extra spaces', () => {
    const wrapper = mount(
      UserAvatar,
      withQuasarBrowser({
        props: {
          user: {
            name: '  John   Doe  ',
          },
        },
      }),
    );

    // Should handle extra spaces gracefully
    expect(wrapper.find('span').text().length).toBeGreaterThan(0);
  });

  it('should convert initials to uppercase', () => {
    const wrapper = mount(
      UserAvatar,
      withQuasarBrowser({
        props: {
          user: {
            name: 'john doe',
          },
        },
      }),
    );

    expect(wrapper.find('span').text()).toBe('JD');
    expect(wrapper.find('span').text()).toMatch(/^[A-Z]+$/);
  });

  it('should have proper avatar structure', () => {
    const wrapper = mount(
      UserAvatar,
      withQuasarBrowser({
        props: {
          user: {
            name: 'Test User',
          },
        },
      }),
    );

    // Check that q-avatar element exists
    expect(wrapper.html()).toContain('q-avatar');
  });

  it('should handle empty name gracefully', () => {
    const wrapper = mount(
      UserAvatar,
      withQuasarBrowser({
        props: {
          user: {
            name: '',
          },
        },
      }),
    );

    // Should not crash with empty name
    expect(wrapper.exists()).toBe(true);
  });

  it('should prefer image over initials when both are available', () => {
    const wrapper = mount(
      UserAvatar,
      withQuasarBrowser({
        props: {
          user: {
            name: 'John Doe',
            avatar: 'https://example.com/john.jpg',
          },
        },
      }),
    );

    // Should show image component in HTML
    expect(wrapper.html()).toContain('q-img');
    expect(wrapper.html()).toContain('https://example.com/john.jpg');

    // Should not show initials text when image is present
    expect(wrapper.find('span').exists()).toBe(false);
  });
});
