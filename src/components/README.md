# Components Directory

This folder groups all Vue components used across the application. Components are organised by feature/role to encourage reuse and keep domain logic close to its consumers.

---

## Top-Level Groups

### `/common`

Reusable building blocks shared across feature areas.

- **`BaseCard.vue`** – Lightweight layout wrapper for cards.
- **`BaseDialog.vue`** – Standard dialog container with header, actions, and slot-based body.
- **`BreadcrumbHeader.vue`** – Page header with breadcrumb trail and optional action slot.
- **`FileUploaderField.vue`** – Wrapper around the Amplify uploader providing validation and previews.
- **`ManagedTable.vue`** – Shared table shell that normalises bulk actions, action columns, and column widths.
- **`SearchStatusDomainFilters.vue`** – Multi-filter header (search + select inputs) used on list pages.
- **`UserPicker.vue`** – Async user selector for linking resources to people.

### `/ui`

Generic presentation components with no business rules.

- **`AvatarPicker.vue`** – Allows selecting or randomising avatar images.
- **`RoleChip.vue`** – Colour-coded role chip with optional icon and i18n label.
- **`StatCard.vue`** – Compact stat display (icon + value + label).
- **`StatusIndicator.vue`** – Pill indicator for status/state glyphs.
- **`UserAvatar.vue`** – Avatar with initials fallback and optional size tweaks.
- **`UserDetailsDialog.vue`** – Generic user profile preview modal.

### `/domain`

Domain management feature.

- **`DomainList.vue`** & **`DomainCard.vue`** – Listing and presentation of domains with search, colour display.
- **`DomainDialog.vue`** – Create/edit form for domains, including colour picker.
- **`DomainJsonManager.vue`** – Admin-only import/export controls for domain hierarchies.

### `/competency`

Components related to competencies & sub-competencies.

- **`CompetencyList.vue` / `CompetencyCard.vue`** – Domain-level competency browsing.
- **`CreateCompetencyDialog.vue`** – Modal form for new competencies.
- **`CompetencyDetailsForm.vue`** – Editable competency details.
- **`QuickAddSubCompetencyDialog.vue`** – Lightweight sub-competency creation dialog.
- **`SubCompetencyCard.vue` / `SubCompetencyList.vue`** – Summary cards for sub-competencies.
- **`SubCompetencyForm.vue`** – Full edit form for sub-competencies.
- **`StudentProgressBadge.vue`** – Status badge summarising a learner’s progress.

### `/subCompetency`

Sub-competency management helpers.

- **`SubCompetencyResourceManager.vue`** – CRUD manager for resources with file cleanup.
- **`SubCompetencyEvaluationManager.vue`** – CRUD manager for evaluations.
- **`SubCompetencyStudentManager.vue`** – Displays student progress and actions within a sub-competency.

### `/resource`

Resource-specific UI (link/document/human/location).

- **`ResourceTable.vue`** – Tabular listing with actions.
- **`ResourceFormDialog.vue`** – Create/edit dialog that supports file uploads.
- **`ResourceCard.vue`** – Card view used in detail views.

### `/evaluation`

Assessment related components.

- **`EvaluationCard.vue`** – Summary card with status and actions.
- **`EvaluationFormDialog.vue`** – Create/edit evaluation form.
- **`EvaluationTable.vue`** – Manager table for evaluations (student vs manager variants).

### `/project`

Project submission workflow.

- **`CreateProjectDialog.vue`** – Form for students or educators to add/update projects.
- **`ProjectCard.vue`** – Summary card with download/validation actions.
- **`ProjectForm.vue`** – Core form logic reused in dialogs.

### `/educator`

Educator dashboards and tables.

- **`StudentAssignmentsTable.vue`** – ManagedTable wrapper for educator ↔ student assignment with bulk assign/unassign.
- **`StudentProgressTable.vue`** – ManagedTable variant showing pending validations with bulk unlock/recommend/validate.
- **`studentProgressTypes.ts`** – Shared types for progress rows.

### `/reports`

Reporting UI used in educator/parent flows.

- **`ReportFilters.vue`** – Filter bar for report generation (period, domain, options).
- **`ReportActions.vue`** – Action buttons (print/share/export).
- **`ReportDomainCard.vue`** – Domain summary block with progression indicators.
- **`ReportSummary.vue`** – Report header with period, summary stats, and metadata.

### `/dashboard`

- **`DashboardStatCard.vue`** – Specialised stat card used on home dashboards.

### `/parent`

- **`ChildCard.vue`** – Parent-facing child summary card.

### `/admin`

Admin-specific management components.

- **`UserActionBar.vue`, `UserActions.vue`, `UserSearchFilters.vue`, `UserStatsCards.vue`, `EditUserDialog.vue`, `LastActiveCell.vue`** – Toolkit for user administration tables.

### `/user`

- **`UserProfileForm.vue`** – Form used inside profile management flows.

### `/utils`

- **`AmplifyUploader.ts`** – Helper for Amplify Storage uploads.

---

## Patterns & Principles

1. **Reusability first** – shared UI (buttons, tables, cards) live under `/ui` or `/common` and accept props/events for configuration.
2. **Feature isolation** – domain/competency/project/etc. folders encapsulate business logic and visuals for that area.
3. **Managed tables** – list-based educator screens now share `ManagedTable`, ensuring:
   - consistent action column widths
   - aligned icon actions and overflow menus
   - a standard bulk-action toolbar with disabled state handling
4. **Lifecycle awareness** – components emitting destructive actions trigger repository methods that cascade cleanup (e.g., removing S3 files).

---

## Usage Tips

- **Import paths** follow the folder structure: `import ManagedTable from 'src/components/common/ManagedTable.vue';`.
- **Slots & composition:** Many containers (e.g., `ManagedTable`, `BaseDialog`) expose slots to customise headers and actions without cloning logic.
- **When to create a new component:**
  - UI pattern appears in more than one feature
  - A feature needs encapsulated logic (e.g., resource manager)
  - Table requires consistent actions/bulk behaviour → extend `ManagedTable`
- **When to keep logic in-place:** If tightly coupled to a single view and unlikely to reuse elsewhere.

---

Keeping this directory curated helps future work move quickly—please update this README when adding notable components or moving modules between folders.
