# Components Organization

This folder contains Vue components organized by their purpose and reusability.

## Structure

### `/ui/` - Generic/Reusable UI Components

Components that can be used across different areas of the application:

- **`StatCard.vue`** - Generic statistics display card with icon, value, and label
- **`RoleChip.vue`** - Generic role display chip with color coding
- **`UserAvatar.vue`** - Generic user avatar with automatic initials fallback
- **`StatusIndicator.vue`** - Generic status display with icons and colors

### `/admin/` - Admin-Specific Components

Components specifically designed for admin functionality:

- **`UserActions.vue`** - User management action buttons (edit, delete, etc.)
- **`UserActionBar.vue`** - Admin toolbar for user management
- **`UserSearchFilters.vue`** - Search and filter controls for user tables
- **`UserStatsCards.vue`** - Wrapper component for user statistics
- **`LastActiveCell.vue`** - Table cell component for displaying last active time

### Root Components

- **`EssentialLink.vue`** - Navigation link component
- **`ExampleComponent.vue`** - Example/demo component

## Design Principles

### Reusability

- UI components should be generic and accept props for customization
- Avoid hardcoded business logic in UI components
- Use clear, semantic prop interfaces

### Single Responsibility

- Each component should have one clear purpose
- Keep components focused and small when possible
- Extract shared logic into composables

### Naming Convention

- Use PascalCase for component names
- Use descriptive names that indicate component purpose
- Group related components in appropriate subfolders

## Usage Guidelines

### When to Create a New UI Component

- The component could be reused in multiple contexts
- It represents a common UI pattern
- It's generic enough to accept props for customization

### When to Create an Admin-Specific Component

- The component contains admin-specific business logic
- It's tightly coupled to admin workflows
- It uses admin-specific data structures or APIs

### Import Paths

```typescript
// UI components
import StatCard from 'src/components/ui/StatCard.vue';
import RoleChip from 'src/components/ui/RoleChip.vue';

// Admin components
import UserActions from 'src/components/admin/UserActions.vue';
import UserActionBar from 'src/components/admin/UserActionBar.vue';
```
