import { mount } from '@vue/test-utils';
import { Quasar } from 'quasar';
import EssentialLink from 'src/components/EssentialLink.vue';
import { describe, expect, it } from 'vitest';

// Boston School: test user-visible behavior, not implementation

describe('EssentialLink - User Behavior', () => {
  it('renders the link with correct label and icon', () => {
    const wrapper = mount(EssentialLink, {
      global: {
        plugins: [Quasar],
      },
      props: {
        title: 'Docs',
        caption: 'Quasar Docs',
        icon: 'school',
        link: 'https://quasar.dev',
      },
    });
    // User sees the title and caption
    expect(wrapper.text()).toContain('Docs');
    expect(wrapper.text()).toContain('Quasar Docs');
    // User sees the icon (flexible: icon name in html)
    expect(wrapper.html()).toMatch(/school/);
  });

  it('renders as external link when link is external', () => {
    const wrapper = mount(EssentialLink, {
      global: { plugins: [Quasar] },
      props: {
        title: 'External',
        link: 'https://external.com',
      },
    });
    // User sees the q-item rendered as an anchor with correct href
    const item = wrapper.find('[href="https://external.com"]');
    expect(item.exists()).toBe(true);
    expect(item.attributes('target')).toBe('_blank');
    expect(item.attributes('tag')).toBe('a');
  });

  it('renders as internal link when link is internal', () => {
    const wrapper = mount(EssentialLink, {
      global: {
        plugins: [Quasar],
      },
      props: {
        title: 'Internal',
        link: '/internal',
      },
    });
    // User sees the link as a router-link (quasar uses tag)
    expect(wrapper.html()).toMatch(/to="\/internal"|href="\/internal"/);
  });

  it('shows only the title if no caption or icon', () => {
    const wrapper = mount(EssentialLink, {
      global: {
        plugins: [Quasar],
      },
      props: {
        title: 'OnlyTitle',
        link: '/only',
      },
    });
    expect(wrapper.text()).toContain('OnlyTitle');
  });
});
