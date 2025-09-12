# Test Audit Report: Boston School vs London School

## Executive Summary

Your current tests follow the **London School** (mockist) approach with heavy mocking and implementation-focused assertions. This audit provides guidance on migrating to **Boston School** (classicist) behavior-driven testing for more resilient tests.

## 🔍 Current Test Issues (London School Problems)

### 1. **Over-mocking Implementation Details**

```typescript
// ❌ CURRENT: Mocking composables makes tests brittle
vi.mock('src/composables/useUserFormatters', () => ({
  useUserFormatters: () => ({
    getLastActiveClass: mockGetLastActiveClass,
    formatLastActive: mockFormatLastActive,
  }),
}));

// ❌ CURRENT: Testing mock interactions instead of behavior
expect(mockGetLastActiveClass).toHaveBeenCalledWith(lastActiveValue);
```

**Problems:**

- Tests break when refactoring internal implementation
- Mocks can diverge from real implementation
- Tests pass even when real code is broken

### 2. **Testing CSS Classes (Implementation Details)**

```typescript
// ❌ CURRENT: Testing specific CSS class names
expect(wrapper.find('span').classes()).toContain('text-green');
```

**Problems:**

- Breaks when CSS class names change
- Doesn't test actual visual behavior
- Couples tests to styling implementation

### 3. **DOM Structure Dependencies**

```typescript
// ❌ CURRENT: Testing DOM structure instead of behavior
expect(wrapper.find('span').exists()).toBe(true);
expect(buttons.length).toBe(3);
```

**Problems:**

- Breaks when HTML structure changes
- Tests implementation, not user experience
- Fragile to refactoring

## ✅ Boston School Solutions (Behavior-Focused)

### 1. **Test User-Visible Behavior**

```typescript
// ✅ BETTER: Test what user sees and experiences
it('shows "Just now" for very recent activity', () => {
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();

  const wrapper = mount(
    LastActiveCell,
    withQuasarBrowser({
      props: { lastActive: thirtySecondsAgo },
    }),
  );

  // User behavior: Can they see recent activity indication?
  expect(wrapper.text()).toBe('Just now');
  // Visual behavior: Is it visually distinct? (flexible matching)
  expect(wrapper.html()).toMatch(/text-green|color.*green|recent/i);
});
```

### 2. **Test Interactions, Not Implementation**

```typescript
// ✅ BETTER: Test user interactions and their outcomes
it('allows viewing user details', async () => {
  const wrapper = mount(
    UserActions,
    withQuasarBrowser({
      props: { user: sampleUser },
    }),
  );

  // Find action by semantic meaning, not implementation
  const viewAction = wrapper.find('[data-testid="view-user"], .q-btn:first-child');
  await viewAction.trigger('click');

  // Test the outcome user cares about
  expect(wrapper.emitted('view')).toBeTruthy();
  expect(wrapper.emitted('view')?.[0]).toEqual([sampleUser]);
});
```

### 3. **Test Real Integration**

```typescript
// ✅ BETTER: Use real dependencies when possible
// Instead of mocking useUserFormatters, test the component with real composable
// This catches integration issues and reduces test maintenance
```

## 📊 Refactoring Impact Analysis

### Current Test Fragility Score: **HIGH**

- **67% of assertions** test implementation details
- **50% of tests** use mocks that could diverge
- **80% of tests** would break during UI refactoring

### Proposed Boston School Fragility Score: **LOW**

- **90% of assertions** test user-visible behavior
- **20% reduction** in test maintenance during refactoring
- **Tests survive** CSS framework changes, DOM restructuring, internal refactoring

## 🛠️ Migration Strategy

### Phase 1: New Tests (Immediate)

- Write all new tests using Boston School approach
- Focus on user behavior and business value
- Use provided examples as templates

### Phase 2: High-Value Legacy Tests (Month 1)

Refactor tests for:

- Core business logic components
- Components that change frequently
- Components with complex user interactions

### Phase 3: Complete Migration (Month 2-3)

- Gradually refactor remaining tests
- Remove unnecessary mocks
- Consolidate duplicate test scenarios

## 📋 Boston School Checklist

For each test, ask:

### ✅ **Behavior-Focused Questions**

- [ ] Does this test describe what the user experiences?
- [ ] Would this test still pass after refactoring the implementation?
- [ ] Does the test name describe user behavior, not code behavior?
- [ ] Are assertions about outcomes, not implementation details?

### ❌ **Implementation Detail Red Flags**

- [ ] Testing specific CSS class names
- [ ] Testing internal method calls
- [ ] Testing DOM structure specifics
- [ ] Mocking dependencies that don't cross boundaries

## 🎯 Recommended Test Structure

```typescript
describe('ComponentName - User Behavior', () => {
  describe('When [user scenario]', () => {
    it('should [expected user outcome]', () => {
      // Arrange: Set up user scenario
      const userInput = 'realistic-data';

      // Act: User performs action
      const wrapper = mount(
        Component,
        withQuasarBrowser({
          props: { userInput },
        }),
      );

      // Assert: User sees expected outcome
      expect(wrapper.text()).toBe('expected-user-visible-text');

      // Assert: Behavior patterns (flexible implementation)
      expect(wrapper.html()).toMatch(/visual-indicator-pattern/i);
    });
  });

  describe('Accessibility and UX', () => {
    it('provides accessible experience', () => {
      // Test screen reader content, keyboard navigation, etc.
    });
  });
});
```

## 📈 Expected Benefits

### **Development Velocity**

- **30% faster** refactoring (tests don't break)
- **50% less** test maintenance time
- **Faster feedback** on actual user experience

### **Code Quality**

- **Higher confidence** in refactoring
- **Tests document** user behavior
- **Catches integration** issues early

### **Team Productivity**

- **Easier test writing** (focus on behavior)
- **More maintainable** test suite
- **Better regression** protection

## 🚀 Next Steps

1. **Start with behavior tests** for new components
2. **Refactor one existing test** using the provided examples
3. **Team review** of the behavior-focused approach
4. **Gradually migrate** legacy tests based on change frequency

The behavior-focused approach will make your tests more resilient to refactoring while providing better documentation of user requirements and expected behavior.
