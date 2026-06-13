# Wave 5 Phase 1H Acceptance Tests

Phase 1H passes when:

- API smoke test harness exists.
- Protected portal runtime QA page exists.
- `npm run verify:phase1h` passes before dependency install.
- `npm run verify:api-smoke` can run after local server startup.
- logged-out users cannot access protected portal/API surfaces.
- owner users can access Administration-protected smoke-test APIs.
- staff users are blocked from Administration and security audit APIs.
- environment context remains visible and protected.
- Access denied and security audit visibility remain in place.
- Wave 4 public website remains preserved.
- No live CRM, Inventory, POS, billing, integrations, AI, marketplace, or mobile scope is introduced.

