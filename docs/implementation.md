# Personal expense tracker

Approved design: personal spending; device-only storage; Android and iOS; Overview, Expenses, and Settings tabs; an add/edit expense modal; monthly totals and category bars; fixed categories; month/category history filters; MXN/USD/EUR display currency; light theme and teal accents.

Implementation tasks:

- [x] Scaffold Expo SDK 57, Router, TypeScript, and local SQLite repository.
- [x] Implement amount/date validation and tested expense CRUD.
- [x] Implement tabs, add/edit form, delete confirmation, summaries, and settings.
- [x] Finish independent review and final verification available in this environment.

Ruling: This is a new project in its own directory; the parent has no usable Git repository, so no worktree is needed.
Historical constraint: Registry DNS was blocked during the initial scaffold. Dependencies and a lockfile are now installed; that initial restriction is not the current verification result.

Independent review found one navigation issue: direct links to the modal could have no previous screen. Fixed with the tabs anchor and a tested fallback to the overview. No critical issues were reported in that review.

## Current verification

- All 30 Node tests pass.
- Full application TypeScript checking and ESLint pass.
- `npx expo install --check` passes after dependency alignment.
- Android and iOS production bundles export successfully.
- React DOM is pinned to React's version and Expo Font to the SDK-compatible range. TypeScript 6 requires explicit Node and React types in this project's compiler configuration.
- npm installation reports 22 unresolved audit findings (3 moderate, 19 high). Dependency compatibility is not a security audit clearance.
- Phone/emulator behavior has not been verified. Follow the manual checklist in `README.md`; exporting bundles is not a device launch.

## Development workflow

Follow `AGENTS.md`: create a new conventional branch from `development` for each independent change, use Conventional Commits, and merge completed changes into `development`. Keep `main` unchanged until an explicitly approved release.
