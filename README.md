# Expo starter

Minimal Expo Router + TypeScript scaffold for Android and iOS. No expense-tracking features or sample expense data are included on `main`.

## Run

Requires Node.js 24.3+ and npm.

```sh
npm ci
npx expo start
```

## Verify

```sh
npm run typecheck
npm run lint
npx expo install --check
npx expo export --platform all
```

Bundle export does not verify operation on a physical device.

## Branches

- `main`: minimal Expo starter only. Earlier commits remain in history.
- `development`: complete expense tracker and its ongoing development.

Start application changes from `development` and merge them back there. Do not merge this starter-only cleanup into `development`, since it deliberately removes the application from `main`.
