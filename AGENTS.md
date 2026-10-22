# Repository workflow

## Branches

- `main` is the stable baseline/release branch. Do not commit changes directly to it or merge releases into it without explicit user approval.
- `development` is the integration branch. All completed changes merge here.
- Before each independent change, start a new branch from `development` using `<type>/<short-kebab-case-description>`.
- Types include `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`, and `perf`.
- Do not reuse a merged branch for another change. Preserve unrelated work; never reset or discard it to switch branches.

## Commits and merges

- Use Conventional Commits: `type(scope): imperative description`; scope is optional.
- Keep commits focused and stage explicit paths. Never commit secrets, local databases, dependencies, or build output.
- Run `git diff --cached --check` and review the staged changes before committing.
- For application changes, run `npm test`, `npm run typecheck`, and `npm run lint`. For dependency changes, also run `npx expo install --check`; for bundling changes, export Android and iOS bundles.
- Report failed or unavailable checks honestly; do not describe them as passing.
- Merge completed change branches into `development` with `--no-ff` and a conventional merge message, for example `chore(merge): integrate docs/git-workflow`.
- Verify branch ancestry and a clean working tree after merging. Leave the checkout on `development` when the task is complete.
- If a remote is configured and publishing is requested, use pull requests targeting `development`, not `main`. Do not push or create a remote without user authorization.

## Architecture

- Follow `docs/architecture.md` for every application change.
- Dependency direction is `presentation → application → domain`; infrastructure implements application contracts. Domain modules must not import React, Expo, SQLite, or network APIs.
- SQLite remains the offline source of truth. Network services such as Firebase are optional synchronization adapters and must never block local expense CRUD.

## Code quality

- Use clear, significant names for classes, functions, variables, and parameters. Avoid ambiguous abbreviations and single-letter names except conventional, short-lived loop indexes.
- Add a concise documentation comment for every class or function that is created or changed. Explain its purpose and important behavior/constraints, not obvious syntax.
- After every code creation or modification, run `npm run lint`. Keep ESLint clean; use Prettier if it is introduced or configured for the project.
- Apply formatting only through the configured formatter/linter. Do not hand-format unrelated code.

## Bootstrap

The existing app was committed on `feat/expense-tracker` as the common initial baseline for `main` and `development`. Subsequent changes follow the workflow above.
