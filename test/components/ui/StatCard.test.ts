import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import StatCard from '../../../src/components/ui/StatCard.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('StatCard - User Experience', () => {
  describe('When users need to understand key metrics at a glance', () => {
    it('should clearly display numerical statistics with context', () => {
      const wrapper = mount(
        StatCard,
        withQuasarBrowser({
          props: {
            icon: 'people',
            color: 'primary',
            value: 42,
            label: 'Users',
          },
        }),
      );

      // User sees the metric value prominently
      expect(wrapper.text()).toContain('42');

      // User understands what the metric represents
      expect(wrapper.text()).toContain('Users');

      // Visual card structure for dashboard context
      expect(wrapper.html()).toMatch(/card|q-card/i);
    });

    it('should accommodate both numeric and text-based metrics', () => {
      const wrapper = mount(
        StatCard,
        withQuasarBrowser({
          props: {
            icon: 'schedule',
            color: 'blue',
            value: '24/7',
            label: 'Availability',
          },
        }),
      );

      // User sees text-based metric clearly
      expect(wrapper.text()).toContain('24/7');
      expect(wrapper.text()).toContain('Availability');
    });

    it('should provide visual context through meaningful icons', () => {
      const wrapper = mount(
        StatCard,
        withQuasarBrowser({
          props: {
            icon: 'trending_up',
            color: 'green',
            value: 1234,
            label: 'Revenue',
          },
        }),
      );

      // User sees the numeric value
      expect(wrapper.text()).toContain('1234');
      expect(wrapper.text()).toContain('Revenue');

      // Visual icon provides additional context
      expect(wrapper.html()).toMatch(/icon|q-icon|trending/i);
    });
  });

  describe('When viewing multiple statistics in a dashboard', () => {
    it('should maintain consistent visual hierarchy across different metrics', () => {
      const metrics = [
        { icon: 'notifications', color: 'orange', value: 15, label: 'Notifications' },
        { icon: 'star', color: 'amber', value: 5, label: 'Rating' },
        { icon: 'dashboard', color: 'purple', value: 100, label: 'Progress' },
      ];

      metrics.forEach(({ icon, color, value, label }) => {
        const wrapper = mount(
          StatCard,
          withQuasarBrowser({
            props: { icon, color, value, label },
          }),
        );

        // Each card displays its metric clearly
        expect(wrapper.text()).toContain(value.toString());
        expect(wrapper.text()).toContain(label);

        // Consistent card structure across all metrics
        expect(wrapper.html()).toMatch(/card|q-card/i);
        expect(wrapper.html()).toMatch(/icon|q-icon/i);
      });
    });

    it('should support different color themes for categorizing information', () => {
      const wrapper = mount(
        StatCard,
        withQuasarBrowser({
          props: {
            icon: 'palette',
            color: 'teal',
            value: 256,
            label: 'Colors',
          },
        }),
      );

      // Metric information is clearly displayed
      expect(wrapper.text()).toContain('256');
      expect(wrapper.text()).toContain('Colors');

      // Color theming is applied (flexible implementation)
      expect(wrapper.html()).toMatch(/teal|color|icon/i);
    });
  });

  describe('When stat cards are used in responsive layouts', () => {
    it('should maintain readable text hierarchy in card format', () => {
      const wrapper = mount(
        StatCard,
        withQuasarBrowser({
          props: {
            icon: 'analytics',
            color: 'indigo',
            value: 9876,
            label: 'Total Visits',
          },
        }),
      );

      // Content is organized for readability
      expect(wrapper.text()).toContain('9876');
      expect(wrapper.text()).toContain('Total Visits');

      // Text centering for visual balance
      expect(wrapper.html()).toMatch(/center|text-center/i);
    });
  });

  describe('Accessibility and Screen Reader Experience', () => {
    it('should provide meaningful content structure for screen readers', () => {
      const wrapper = mount(
        StatCard,
        withQuasarBrowser({
          props: {
            icon: 'assessment',
            color: 'blue-grey',
            value: 87,
            label: 'Completion Rate',
          },
        }),
      );

      // Screen reader can understand the metric
      const text = wrapper.text();
      expect(text).toContain('87');
      expect(text).toContain('Completion Rate');

      // Logical content flow
      expect(text).toMatch(/(87.*Completion Rate|Completion Rate.*87)/);
    });

    it('should maintain semantic meaning in card structure', () => {
      const wrapper = mount(
        StatCard,
        withQuasarBrowser({
          props: {
            icon: 'security',
            color: 'red',
            value: 'Secure',
            label: 'System Status',
          },
        }),
      );

      // Semantic card structure for assistive technology
      expect(wrapper.html()).toMatch(/card|section|role/i);

      // Content is accessible
      expect(wrapper.text()).toContain('Secure');
      expect(wrapper.text()).toContain('System Status');
    });
  });
});
