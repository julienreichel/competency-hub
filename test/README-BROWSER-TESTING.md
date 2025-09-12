# Browser Testing with Vitest

This project uses Vitest browser mode for comprehensive component and integration testing. Browser mode provides a real browser environment for testing DOM manipulation, user interactions, and browser-specific APIs.

## Setup

### Dependencies

The following packages are required for browser testing:

```json
{
  "@vitest/browser": "^3.2.4",
  "@vue/test-utils": "^2.x.x",
  "@vitejs/plugin-vue": "^5.x.x",
  "playwright": "^1.x.x"
}
```

### Configuration

Browser tests use a separate configuration file: `vitest.browser.config.ts`

Key features:

- **Playwright Provider**: Uses Chromium browser for testing
- **Vue Plugin Support**: Handles .vue file compilation
- **Headless Mode**: Runs without GUI for CI environments
- **Custom Setup**: Dedicated setup file for browser-specific initialization

### Test Organization

```
test/
├── components/           # Vue component tests
│   ├── admin/           # Admin interface components
│   │   ├── LastActiveCell.test.ts
│   │   ├── UserActionBar.test.ts
│   │   ├── UserActions.test.ts
│   │   ├── UserSearchFilters.test.ts
│   │   └── UserStatsCards.test.ts
│   └── ui/              # UI component library
│       ├── RoleChip.test.ts
│       ├── StatCard.test.ts
│       ├── StatusIndicator.test.ts
│       └── UserAvatar.test.ts
├── composables/         # Vue composables
│   ├── useAuth.test.ts
│   └── useUserFormatters.test.ts
├── models/              # Domain models
├── repositories/        # Data repositories
├── browser-test-utils.ts # Quasar + i18n test utilities
└── setup.ts            # Test setup configuration
```

## Running Tests

### Local Development

```bash
# Run all tests (unit + browser) in watch mode
npm run test:watch

# Run all tests once
npm run test

# Run tests with UI interface
npm run test:ui

# Run with coverage report
npm run test:coverage

# Check coverage with verbose output
npm run test:coverage:check
```

### CI/CD Integration

Browser tests are automatically run in the CI pipeline:

1. **Install Dependencies**: `npm ci`
2. **Install Browser**: `npx playwright install chromium`
3. **Run Tests**: `npm run test`

The CI is configured to:

- Run all tests (unit + browser) together
- Upload test artifacts on failure
- Support headless browser execution
- Fail build if any tests fail
- Generate coverage reports

## Test Types

### 1. Vue Component Testing

Test Vue components with real Quasar UI integration and i18n support:

```typescript
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import StatCard from '../../../src/components/ui/StatCard.vue';
import { withQuasarBrowser } from '../../browser-test-utils';

describe('StatCard Component', () => {
  it('should render with required props', () => {
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

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('42');
    expect(wrapper.text()).toContain('Users');
  });
});
```

### 2. Composable Testing

Test Vue composables in a real browser environment:

```typescript
import { useUserFormatters } from '../../src/composables/useUserFormatters';

describe('useUserFormatters (Browser)', () => {
  const { getUserInitialsFromUser, formatLastActive } = useUserFormatters();

  it('should format user data correctly', () => {
    const user = { getInitials: () => 'JD' };
    expect(getUserInitialsFromUser(user)).toBe('JD');
  });
});
```

### 2. Composable Testing

Test Vue composables in a real browser environment:

```typescript
import { useUserFormatters } from '../../src/composables/useUserFormatters';

describe('useUserFormatters (Browser)', () => {
  const { getUserInitialsFromUser, formatLastActive } = useUserFormatters();

  it('should format user data correctly', () => {
    const user = { getInitials: () => 'JD' };
    expect(getUserInitialsFromUser(user)).toBe('JD');
  });
});
```

### 3. User Interaction Testing

Test complex user interactions with Quasar components:

```typescript
describe('UserActions Component', () => {
  it('should emit events when buttons are clicked', async () => {
    const wrapper = mount(
      UserActions,
      withQuasarBrowser({
        props: { user: mockUser },
      }),
    );

    const buttons = wrapper.findAll('.q-btn');
    const viewButton = buttons[0];

    await viewButton.trigger('click');
    expect(wrapper.emitted('view')).toBeTruthy();
  });
});
```

### 4. DOM Testing

Test DOM manipulation and browser APIs:

````typescript
it('should handle click events', () => {
  const button = document.createElement('button');
  let clicked = false;

  button.addEventListener('click', () => {
    clicked = true;
  });

  button.click();
  expect(clicked).toBe(true);
});
### 4. DOM Testing

Test DOM manipulation and browser APIs:

```typescript
it('should handle click events', () => {
  const button = document.createElement('button');
  let clicked = false;

  button.addEventListener('click', () => {
    clicked = true;
  });

  button.click();
  expect(clicked).toBe(true);
});
````

### 5. Browser API Testing

Test browser-specific functionality:

```typescript
it('should test local storage', () => {
  localStorage.setItem('key', 'value');
  expect(localStorage.getItem('key')).toBe('value');
});
```

### 5. Browser API Testing

Test browser-specific functionality:

```typescript
it('should test local storage', () => {
  localStorage.setItem('key', 'value');
  expect(localStorage.getItem('key')).toBe('value');
});
```

## Browser Test Utilities

### withQuasarBrowser Helper

The `browser-test-utils.ts` file provides essential utilities for testing Vue components with Quasar and i18n:

```typescript
import { withQuasarBrowser } from '../../browser-test-utils';

// Provides:
// - Quasar component registration (QBtn, QCard, QInput, etc.)
// - Vue I18n internationalization support
// - Proper plugin configuration for browser testing

const wrapper = mount(
  Component,
  withQuasarBrowser({
    props: {
      /* component props */
    },
    global: {
      /* additional global config */
    },
  }),
);
```

### Supported Quasar Components

Pre-registered components for testing:

- **Layout**: QCard, QCardSection
- **Buttons**: QBtn, QBtnGroup
- **Form**: QInput, QSelect, QToggle
- **Display**: QIcon, QBadge, QChip, QTooltip
- **Navigation**: QList, QItem, QItemSection, QMenu
- **Feedback**: QSpinner, QLinearProgress
- **Data**: QTable

### Component Testing (Future)

## Current Test Coverage

### Statistics

- **Total Tests**: 263 tests across 16 test files
- **Component Tests**: 74 tests across 9 component files
  - **UI Components**: 28 tests (4 files)
  - **Admin Components**: 46 tests (5 files)
- **Coverage**: 94.87% overall (exceeds 80% requirement)

### Component Test Breakdown

#### UI Components

- **StatCard**: 7 tests - visual display, props validation
- **StatusIndicator**: 7 tests - status states, styling
- **UserAvatar**: 11 tests - image handling, initials fallback
- **RoleChip**: 3 tests - role display, color coding

#### Admin Components

- **LastActiveCell**: 6 tests - date formatting, time display
- **UserActionBar**: 8 tests - search filters, button actions
- **UserActions**: 8 tests - dropdown menu, user operations
- **UserSearchFilters**: 12 tests - input handling, form controls
- **UserStatsCards**: 12 tests - statistics display, data formatting

## Best Practices

### Component Testing Patterns

1. **Use withQuasarBrowser**: Always wrap component mounts with the utility
2. **Test Props**: Verify component behavior with different prop combinations
3. **Test Events**: Ensure components emit events correctly
4. **Test User Interactions**: Click buttons, fill forms, test real usage
5. **Test Edge Cases**: Null values, empty arrays, error states

### Test Structure

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clear DOM state between tests
3. **Specific**: Test one behavior per test case
4. **Descriptive**: Use clear test descriptions

### Performance

1. **Selective Testing**: Use browser mode for tests that need real browser environment
2. **Parallel Execution**: Configure tests to run efficiently
3. **Resource Management**: Clean up resources after tests

### CI/CD Considerations

1. **Headless Mode**: Always use headless mode in CI
2. **Browser Installation**: Ensure browsers are installed before running tests
3. **Artifact Collection**: Save test reports and screenshots on failure
4. **Timeout Configuration**: Set appropriate timeouts for CI environment

## Troubleshooting

### Common Issues

1. **Browser Not Found**: Ensure Playwright browsers are installed

   ```bash
   npx playwright install chromium
   ```

2. **Vue File Compilation**: Ensure @vitejs/plugin-vue is configured

   ```typescript
   import vue from '@vitejs/plugin-vue';

   export default defineConfig({
     plugins: [vue()],
     // ...
   });
   ```

3. **Import Resolution**: Check alias configuration in vitest config
   ```typescript
   resolve: {
     alias: {
       '@': resolve(__dirname, './src'),
       src: resolve(__dirname, './src'),
     },
   }
   ```

### Debugging

1. **Debug Mode**: Run tests with `--inspect` flag
2. **Browser Console**: Use `console.log` in tests
3. **Screenshots**: Capture screenshots on failure (future enhancement)
4. **Slow Tests**: Use `--reporter=verbose` for detailed output

## Integration with Existing Tests

Browser tests complement but don't replace unit tests:

- **Unit Tests**: Fast, isolated, mock dependencies
- **Browser Tests**: Real environment, DOM interactions, browser APIs
- **Integration Tests**: Full application flow testing

Use browser tests for:

- Vue component rendering and behavior
- Quasar UI component integration
- Form interactions and validation
- User event handling (clicks, inputs)
- Internationalization (i18n) functionality
- DOM manipulation logic
- Browser API interactions
- Visual behavior verification
- Cross-browser compatibility

The unified testing approach provides comprehensive coverage while maintaining fast feedback loops for development. All tests run in browser mode using Vitest with Playwright, ensuring authentic component behavior testing.
