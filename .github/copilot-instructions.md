# **Operating Guide**

## 1) Project Context

- Vue 3 + Quasar
- Composition API + TypeScript
- Vitest tests (Boston School, behavior-first)
- i18n required for _every_ user-facing string
- DRY is mandatory

## 2) Core Principles

### DRY (Do Not Repeat Yourself) — **Mandatory**

- **No duplicated template blocks** → Use computed `v-bind` object patterns.
- **No repeated logic** → Extract to `useX` composables or pure utilities.
- **No repeated UI structures** → Convert to components.
- Parameterize conditions rather than branching in templates.

Example:

```vue
<q-item clickable v-bind="linkAttrs">
  <q-item-section>{{ title }}</q-item-section>
</q-item>

<script setup>
const linkAttrs = computed(() => (isInternal ? { to: link } : { tag: 'a', href: link }));
</script>
```

### Clean Code & Architecture

- **Single Responsibility**: A component or function does one meaningful thing.
- Keep components small (< 100 lines when possible).
- Props define inputs, emits define outputs (semantic event names).
- Move business logic out of components → composables or pure functions.
- Prefer pure functions — avoid hidden side effects.
- **YAGNI**: Do not implement features "just in case".

### i18n (Non-Negotiable)

- **No hardcoded strings** in templates or scripts.
- Always use `$t()` / `useI18n()`.

Example:

```vue
<p>{{ t('forms.enterName') }}</p>
```

### Code Style Constraints

- **No magic numbers** → define named constants (`SCREAMING_SNAKE_CASE`).
- Prefer `const`, not `let`, unless mutation is intentional.
- Prefer `object destructuring` when extracting properties.
- Keep imports ordered: external → internal → local.

## 3) Naming Conventions

| Type                  | Convention               | Example            |
| --------------------- | ------------------------ | ------------------ |
| Components            | PascalCase               | `UserCard.vue`     |
| Composables           | camelCase + `use` prefix | `useUserStore.ts`  |
| Variables & Functions | camelCase                | `fetchUser()`      |
| Constants             | SCREAMING_SNAKE_CASE     | `MAX_RETRIES`      |
| CSS Classes           | kebab-case               | `user-card-header` |

## 4) Component Structure Standard

```vue
<template>
  <!-- Keep template declarative -->
</template>

<script setup>
import { ref, computed } from 'vue';
const props = defineProps({...});
const emit = defineEmits(['update']);
const { t } = useI18n();
const state = ref();
const derived = computed(() => state.value + 1);
function doAction() { emit('update', state.value); }
</script>

<style scoped></style>
```

## 5) Dialog Standard

All dialogs must use `BaseDialog.vue`.

Rules:

- Controlled via `v-model` only.
- No `v-close-popup`.
- `Enter` submits (if `useForm = true`).
- `Esc` cancels **unless** `persistent = true`.
- Labels must come from i18n.
- Dialogs must emit: `submit`, `cancel`, `closed`.

Behavior Tests:

```ts
expect(wrapper.emitted('submit')).toBeTruthy();
expect(wrapper.emitted('cancel')).toBeTruthy();
```

## 6) Testing — Boston School

### Test **what the user sees and does**, not how code works.

✅ Do assert:

- visible text
- emitted events
- user interaction outcomes
- behavior that would survive DOM restructuring

❌ Do **not** assert:

- CSS classes
- DOM element counts or hierarchy
- calls to internal helpers
- mock function call counts

### Behavior Test Template

```ts
describe('Feature behavior', () => {
  it('shows expected state and reacts to user action', async () => {
    const wrapper = mount(Component, options);
    expect(wrapper.text()).toMatch(/expected text/i);
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('save')).toBeTruthy();
  });
});
```

### Mock only external boundaries

- APIs
- Network
- LocalStorage / time

## 7) Coverage Expectations

- ≥ 80% for all new code
- ≥ 90% for core logic & composables
- Every bug fix gets a test preventing regression

## 8) Code Review Checklist

- [ ] No duplicated template / logic
- [ ] Extracted reusable code where patterns repeat
- [ ] All UI text uses i18n
- [ ] No magic numbers → constants
- [ ] Tests verify **behavior**, not implementation
- [ ] Component scope is focused (single responsibility)

## 9) Commit Message Rules

Use the format:

```
type(scope): Description
```

### Rules

- Use **imperative mood**: "Add", not "Added" or "Adds"
- **Sentence-case**: First letter capitalized, rest lowercase unless proper noun
- Keep description concise and meaningful
- Keep line length under 100 chars
- Use body bullets for _why_ when needed:

```
fix(auth): Prevent logout loop

* Caused by invalid token re-check
* Added fallback to refresh endpoint
```

### Commit Types

| Type     | Meaning                                    |
| -------- | ------------------------------------------ |
| feat     | New user-visible feature                   |
| fix      | Bug fix                                    |
| refactor | Code restructuring without behavior change |
| test     | Add or improve tests                       |
| docs     | Documentation only                         |
| style    | Formatting / lint-only changes             |
| chore    | Build, scripts, tooling changes            |
| ci       | CI/CD pipeline changes                     |

## 10) Release Flow

```
git checkout main
git pull
git merge dev
npm version <patch|minor|major>
git push && git push --tags
Generate RELEASE-NOTES.md (manual text, do not commit)
```
