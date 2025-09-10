# Code Quality Guidelines

This document outlines the code quality standards and tools configured for this project.

## 🎯 Quality Standards

### Code Complexity Limits

- **Cyclomatic Complexity**: Maximum 10 per function
- **Function Length**: Maximum 50 lines (excluding comments and blank lines)
- **Function Parameters**: Maximum 4 parameters
- **Nesting Depth**: Maximum 4 levels

### Test Coverage Requirements

- **Global Minimum**: 80% coverage (statements, branches, functions, lines)
- **Domain Models**: 95% coverage minimum
- **Repositories**: 90% coverage minimum

## 🛠️ Tools Configuration

### ESLint Rules

#### Source Code (src/\*\*)

- **Cyclomatic Complexity**: Maximum 10 per function
- **Function Length**: Maximum 50 lines (excluding comments and blank lines)
- **Function Parameters**: Maximum 4 parameters
- **Nesting Depth**: Maximum 4 levels
- **TypeScript**: Strict rules (no `any`, explicit return types)
- **Vue.js**: Best practices with kebab-case component names in templates

#### Test Files (test/\*_, _.test._, _.spec.\*)

- **Cyclomatic Complexity**: Maximum 30 per function (relaxed for comprehensive test scenarios)
- **Function Length**: Maximum 500 lines (allows for detailed test suites and arrow functions)
- **Function Parameters**: No limit (test utilities may need many parameters)
- **Nesting Depth**: No limit (describe > describe > it > expect patterns)
- **Magic Numbers**: Allowed (test data and expectations)

### Naming Conventions

- **Components**: PascalCase for file names (`GameBoard.vue`), kebab-case in templates (`<game-board>`)
- **Composables**: camelCase with `use` prefix (`useGameState.js`)
- **Functions/Variables**: camelCase (`calculateScore`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_PLAYERS`)
- **CSS Classes**: kebab-case (`game-board`)
- **Files**: kebab-case for multi-word (`game-state.js`)

### Prettier

- Automatic code formatting on save
- Consistent style across the entire codebase

### Husky Git Hooks

#### Pre-commit

- Runs `lint-staged` to format and lint only staged files
- Executes tests to ensure they pass
- Checks coverage thresholds

#### Commit-msg

- Validates commit message format using conventional commits
- Enforces proper commit structure: `type(scope): description`

#### Pre-push

- Runs full build to ensure compilation succeeds
- Executes complete test suite with coverage
- Performs TypeScript type checking

## 📋 Available Scripts

### Code Quality

```bash
npm run lint              # Check for linting errors
npm run lint:fix          # Fix auto-fixable linting errors
npm run format            # Format code with Prettier
npm run format:check      # Check if code is properly formatted
npm run quality:check     # Run all quality checks
npm run quality:fix       # Fix all auto-fixable issues
```

### Testing

```bash
npm run test              # Run tests in watch mode
npm run test:run          # Run tests once
npm run test:coverage     # Run tests with coverage report
npm run test:ui           # Open Vitest UI
```

## 🚀 Development Workflow

### 1. Before Starting Work

```bash
npm run quality:check     # Ensure starting point is clean
```

### 2. During Development

- Write code following the complexity guidelines
- Add tests for new functionality
- Use meaningful commit messages

### 3. Before Committing

The pre-commit hook will automatically:

- Format your code
- Fix linting issues
- Run tests
- Check coverage

### 4. Commit Message Format

```
type(scope): description

feat(auth): add user authentication
fix(api): handle null responses in user repository
docs(readme): update installation instructions
test(models): add edge cases for competency validation
```

### 5. Before Pushing

The pre-push hook will:

- Build the project
- Run full test suite
- Check TypeScript compilation

## 🎨 IDE Configuration

### VS Code Extensions

Required extensions are automatically recommended:

- ESLint
- Prettier
- Vue Language Features (Volar)
- Vitest Explorer
- GitHub Copilot

### Editor Settings

- Format on save enabled
- 100-character ruler
- Auto-fix ESLint on save
- Auto-organize imports

## 📊 Coverage Thresholds

| Component    | Statements | Branches | Functions | Lines |
| ------------ | ---------- | -------- | --------- | ----- |
| Global       | 80%        | 80%      | 80%       | 80%   |
| Models       | 95%        | 90%      | 95%       | 95%   |
| Repositories | 90%        | 85%      | 90%       | 90%   |

## 🚫 Common Anti-Patterns to Avoid

### ❌ Don't

```typescript
// Magic numbers
setTimeout(callback, 300000);

// Complex functions
function processUser(user: any) {
  if (user) {
    if (user.permissions) {
      if (user.permissions.canEdit) {
        // 20+ lines of logic
      }
    }
  }
}

// No return type
function calculateSomething(a, b) {
  return a + b;
}
```

### ✅ Do

```typescript
// Named constants
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
setTimeout(callback, CACHE_TIMEOUT);

// Simple, focused functions
function canUserEdit(user: User): boolean {
  return user?.permissions?.canEdit ?? false;
}

function processEditableUser(user: User): void {
  // Single responsibility
}

// Explicit types
function calculateTotal(price: number, tax: number): number {
  return price + tax;
}
```

## 🔧 Troubleshooting

### Coverage Threshold Failures

If coverage drops below thresholds:

1. Add tests for uncovered code
2. Remove dead code
3. Update thresholds if justified

### Lint Failures

```bash
npm run lint:fix          # Fix auto-fixable issues
npm run format            # Format code
```

### Pre-commit Hook Failures

```bash
npm run quality:fix       # Fix issues
git add .                 # Stage fixes
git commit                # Retry commit
```

## 📈 Continuous Improvement

This configuration enforces high standards but can be adjusted as the project evolves:

1. **Complexity Limits**: Can be adjusted in `eslint.config.js`
2. **Coverage Thresholds**: Can be modified in `vitest.config.ts`
3. **Commit Rules**: Can be updated in `commitlint.config.js`

Remember: These tools help maintain quality, but good judgment and code review are still essential!
