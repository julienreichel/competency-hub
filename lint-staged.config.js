/**
 * Lint-staged configuration
 * Runs linters and formatters on staged files before commit
 */
export default {
  // Lint and format TypeScript and Vue files
  '*.{ts,vue}': 'eslint --fix',

  // Lint and format JavaScript files
  '*.{js,cjs,mjs}': 'eslint --fix',

  // Format files after linting
  '*.{ts,vue,js,cjs,mjs,json,md,html,css,scss}': 'prettier --write',
};
