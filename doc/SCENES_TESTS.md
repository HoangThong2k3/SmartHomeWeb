Testing guide — Scenes feature

This document explains how to add basic unit/e2e tests for the Scenes UI.

1) Local test setup (recommended)
- Install testing libraries:
  - Jest + React Testing Library for unit tests
    - npm i -D jest @testing-library/react @testing-library/jest-dom babel-jest
  - Cypress or Playwright for end-to-end tests

2) Example unit test (pseudo)
- Test: CreateSceneForm shows validation errors when required fields missing.

3) Example e2e flows
- Scenario: Open Scenes page -> Create scene with one action -> Execute scene -> Verify success toast.

4) CI
- Add GitHub Action to run tests on push/pull requests.

Notes:
- This repo does not include test setup by default. Follow above steps to add tests and CI.

