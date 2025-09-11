import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LastActiveCell from '../../../src/components/admin/LastActiveCell.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

// Mock the useUserFormatters composable
const mockGetLastActiveClass = vi.fn();
const mockFormatLastActive = vi.fn();

vi.mock('src/composables/useUserFormatters', () => ({
  useUserFormatters: (): {
    getLastActiveClass: typeof mockGetLastActiveClass;
    formatLastActive: typeof mockFormatLastActive;
  } => ({
    getLastActiveClass: mockGetLastActiveClass,
    formatLastActive: mockFormatLastActive,
  }),
}));

describe('LastActiveCell Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with last active data', () => {
    mockGetLastActiveClass.mockReturnValue('text-green');
    mockFormatLastActive.mockReturnValue('2 hours ago');

    const wrapper = mount(
      LastActiveCell,
      withQuasarBrowser({
        props: {
          lastActive: '2024-09-11T12:00:00Z',
        },
      }),
    );

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toBe('2 hours ago');
    expect(wrapper.find('span').classes()).toContain('text-green');
  });

  it('should call useUserFormatters with correct lastActive prop', () => {
    const lastActiveValue = '2024-09-10T08:30:00Z';
    mockGetLastActiveClass.mockReturnValue('text-orange');
    mockFormatLastActive.mockReturnValue('1 day ago');

    mount(
      LastActiveCell,
      withQuasarBrowser({
        props: {
          lastActive: lastActiveValue,
        },
      }),
    );

    expect(mockGetLastActiveClass).toHaveBeenCalledWith(lastActiveValue);
    expect(mockFormatLastActive).toHaveBeenCalledWith(lastActiveValue);
  });

  it('should apply different CSS classes based on recency', () => {
    mockGetLastActiveClass.mockReturnValue('text-red');
    mockFormatLastActive.mockReturnValue('1 week ago');

    const wrapper = mount(
      LastActiveCell,
      withQuasarBrowser({
        props: {
          lastActive: '2024-09-04T12:00:00Z',
        },
      }),
    );

    expect(wrapper.find('span').classes()).toContain('text-red');
    expect(wrapper.text()).toBe('1 week ago');
  });

  it('should update when lastActive prop changes', async () => {
    mockGetLastActiveClass.mockReturnValueOnce('text-green').mockReturnValueOnce('text-orange');
    mockFormatLastActive.mockReturnValueOnce('1 hour ago').mockReturnValueOnce('1 day ago');

    const wrapper = mount(
      LastActiveCell,
      withQuasarBrowser({
        props: {
          lastActive: '2024-09-11T14:00:00Z',
        },
      }),
    );

    expect(wrapper.text()).toBe('1 hour ago');

    await wrapper.setProps({ lastActive: '2024-09-10T14:00:00Z' });

    expect(wrapper.text()).toBe('1 day ago');
    expect(mockGetLastActiveClass).toHaveBeenCalledTimes(2);
    expect(mockFormatLastActive).toHaveBeenCalledTimes(2);
  });

  it('should handle edge cases like very old dates', () => {
    mockGetLastActiveClass.mockReturnValue('text-grey');
    mockFormatLastActive.mockReturnValue('Never');

    const wrapper = mount(
      LastActiveCell,
      withQuasarBrowser({
        props: {
          lastActive: '',
        },
      }),
    );

    expect(wrapper.text()).toBe('Never');
    expect(wrapper.find('span').classes()).toContain('text-grey');
  });

  it('should have proper component structure', () => {
    mockGetLastActiveClass.mockReturnValue('text-primary');
    mockFormatLastActive.mockReturnValue('Just now');

    const wrapper = mount(
      LastActiveCell,
      withQuasarBrowser({
        props: {
          lastActive: '2024-09-11T15:00:00Z',
        },
      }),
    );

    const spanElement = wrapper.find('span');
    expect(spanElement.exists()).toBe(true);
    expect(spanElement.text()).toBe('Just now');
  });
});
