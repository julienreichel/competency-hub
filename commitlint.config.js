/**
 * Commitlint configuration for enforcing conventional commits
 * @see https://commitlint.js.org/#/
 */

// Rule levels: 0 = disabled, 1 = warning, 2 = error
const ERROR = 2;
const MAX_LENGTH = 100;

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce specific types
    'type-enum': [
      ERROR,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation changes
        'style', // Code style changes (formatting, etc.)
        'refactor', // Code refactoring
        'test', // Adding or updating tests
        'chore', // Maintenance tasks
        'perf', // Performance improvements
        'ci', // CI/CD changes
        'build', // Build system changes
        'revert', // Revert previous commit
      ],
    ],
    // Enforce scope format
    'scope-case': [ERROR, 'always', 'kebab-case'],
    // Enforce subject format
    'subject-case': [ERROR, 'always', 'sentence-case'],
    'subject-empty': [ERROR, 'never'],
    'subject-max-length': [ERROR, 'always', MAX_LENGTH],
    // Header format
    'header-max-length': [ERROR, 'always', MAX_LENGTH],
  },
};
