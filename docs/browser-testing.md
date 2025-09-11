# Browser Testing with Vitest

This project uses Vitest browser mode for testing Vue components with real DOM rendering in a browser environment.

## Overview

Browser tests differ from unit tests by:

- Running in a real browser environment (Chromium)
- Rendering components with actual DOM
- Testing user interactions and browser-specific behavior
- Providing visual feedback with screenshots on test failures

## Setup Files

### Configuration

- `vitest.browser.config.ts` - Browser testing configuration
- `test/setup-browser.ts` - Browser test environment setup
- `test/browser-test-utils.ts` - Browser-specific utilities

### Utilities

- `withQuasarBrowser()` - Provides Quasar component stubs for browser testing
- Uses render functions instead of templates to avoid runtime compilation issues

## Writing Browser Tests

### File Naming

Place browser tests in `test/components/` with `.browser.test.ts` extension:

```
test/components/MyComponent.browser.test.ts
```

### Basic Example

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MyComponent from '../../src/components/ui/MyComponent.vue';
import { withQuasarBrowser } from '../browser-test-utils';

describe('MyComponent (Browser)', () => {
  it('should render correctly', () => {
    const wrapper = mount(
      MyComponent,
      withQuasarBrowser({
        props: {
          title: 'Test Title',
        },
      }),
    );

    expect(wrapper.text()).toBe('Test Title');
    expect(wrapper.find('.component-class').exists()).toBe(true);
  });
});
```

## Running Browser Tests

### Development (with UI)

```bash
npm run test:browser
```

### CI/Production (headless)

```bash
npm run test:browser:run
```

### Specific Test File

```bash
npm run test:browser:run -- test/components/MyComponent.browser.test.ts
```

## When to Use Browser Tests

✅ **Use browser tests for:**

- Component rendering and DOM structure
- User interactions (clicks, form inputs)
- CSS styling and layout
- Browser-specific APIs
- Integration between components

❌ **Use unit tests for:**

- Pure functions and utilities
- Composables logic
- Business logic
- Data transformations

## Quasar Component Testing

The `withQuasarBrowser()` utility provides stubs for common Quasar components:

- `QChip` - Renders as `<span class="q-chip">`
- `QBtn` - Renders as `<button class="q-btn">`
- `QIcon` - Renders as `<i class="q-icon">`

These stubs maintain the basic structure while avoiding complex Quasar initialization.

## Test Debugging

### Screenshots

Failed tests automatically capture screenshots in:

```
test/components/__screenshots__/
```

### Console Logs

Browser console output is available in test output for debugging.

### Inspection

Use browser developer tools by running tests in non-headless mode during development.

## Example: RoleChip Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RoleChip from '../../src/components/ui/RoleChip.vue';
import { withQuasarBrowser } from '../browser-test-utils';

describe('RoleChip Component (Browser)', () => {
  it('should render Admin role with correct text', () => {
    const wrapper = mount(
      RoleChip,
      withQuasarBrowser({
        props: {
          role: 'Admin',
        },
      }),
    );

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toBe('Admin');
  });

  it('should have Quasar chip structure', () => {
    const wrapper = mount(
      RoleChip,
      withQuasarBrowser({
        props: {
          role: 'Admin',
        },
      }),
    );

    const chipElement = wrapper.find('.q-chip');
    expect(chipElement.exists()).toBe(true);
    expect(chipElement.text()).toBe('Admin');
  });
});
```

This example demonstrates:

- Basic component mounting with props
- Text content verification
- DOM structure testing with Quasar components
