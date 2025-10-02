import { mount } from '@vue/test-utils';
import { Quasar } from 'quasar';
import BreadcrumbHeader from 'src/components/common/BreadcrumbHeader.vue';
import { describe, expect, it } from 'vitest';

// Boston School: test user-visible behavior, not implementation

describe('BreadcrumbHeader - User Behavior', () => {
  it('renders the breadcrumb trail and title', () => {
    const wrapper = mount(BreadcrumbHeader, {
      global: { plugins: [Quasar] },
      props: {
        title: 'Math',
        breadcrumbs: [
          { label: 'Home', to: '/' },
          { label: 'Domains', to: '/domains' },
          { label: 'Math', to: '/domains/math' },
        ],
      },
    });
    // User sees all breadcrumb labels as <q-breadcrumbs-el>
    const breadcrumbs = wrapper.findAll('q-breadcrumbs-el');
    const labels = breadcrumbs.map((el) => el.attributes('label'));
    expect(labels).toContain('Home');
    expect(labels).toContain('Domains');
    expect(labels).toContain('Math');
    // User sees the last breadcrumb as the title
    expect(wrapper.find('.breadcrumb-title').exists() || wrapper.text().includes('Math')).toBe(
      true,
    );
  });

  it('renders only the title if no breadcrumbs', () => {
    const wrapper = mount(BreadcrumbHeader, {
      global: { plugins: [Quasar] },
      props: {
        title: 'Dashboard',
      },
    });
    expect(wrapper.text()).toContain('Dashboard');
  });

  it('renders custom slot content if provided', () => {
    const wrapper = mount(BreadcrumbHeader, {
      global: { plugins: [Quasar] },
      props: {
        title: 'Custom',
        breadcrumbs: [{ label: 'Home', to: '/' }],
      },
      slots: {
        default: '<div class="custom-slot">Extra</div>',
      },
    });
    expect(wrapper.html()).toMatch(/custom-slot/);
    expect(wrapper.text()).toContain('Extra');
  });
});
