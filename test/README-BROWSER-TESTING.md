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
├── components/           # Browser-specific tests
│   ├── useUserFormatters.test.ts   # Composable testing
│   ├── browser-dom.test.ts         # DOM manipulation tests
│   └── ui/              # UI component tests (future)
├── setup-browser.ts     # Browser test setup
└── setup.ts            # Standard test setup
```

## Running Tests

### Local Development

```bash
# Run browser tests in watch mode
npm run test:browser

# Run browser tests once
npm run test:browser:run

# Run with UI interface
npm run test:browser:ui

# Run with coverage
npm run test:browser:coverage

# Run all tests (unit + browser)
npm run test:all
```

### CI/CD Integration

Browser tests are automatically run in the CI pipeline:

1. **Install Dependencies**: `npm ci`
2. **Install Browser**: `npx playwright install chromium`
3. **Run Tests**: `npm run test:browser:run`

The CI is configured to:

- Run browser tests in parallel with unit tests
- Upload test artifacts on failure
- Support headless browser execution
- Fail build if browser tests fail

## Test Types

### 1. Composable Testing

Test Vue composables in a real browser environment:

```typescript
import { useUserFormatters } from '../../src/composables/useUserFormatters';

describe('useUserFormatters (Browser)', () => {
  const { getUserInitials, formatLastActive } = useUserFormatters();

  it('should format user data correctly', () => {
    expect(getUserInitials('John Doe')).toBe('JD');
  });
});
```

### 2. DOM Testing

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
```

### 3. Browser API Testing

Test browser-specific functionality:

```typescript
it('should test local storage', () => {
  localStorage.setItem('key', 'value');
  expect(localStorage.getItem('key')).toBe('value');
});
```

### 4. Component Testing (Future)

Vue component testing with real DOM rendering:

```typescript
import { mount } from '@vue/test-utils';
import MyComponent from '../../../src/components/MyComponent.vue';

it('should render component', () => {
  const wrapper = mount(MyComponent, {
    props: { message: 'Hello' },
  });

  expect(wrapper.text()).toContain('Hello');
});
```

## Best Practices

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

- DOM manipulation logic
- Browser API interactions
- Complex user interactions
- Visual behavior verification
- Cross-browser compatibility

The testing strategy provides comprehensive coverage while maintaining fast feedback loops for development.
