# Wave 5 Phase 1J — First Local Test Results Review

## Objective

Capture the first real local install/runtime results in a consistent format so bugs can be fixed cleanly instead of patching randomly.

## How to Use

1. Copy the template:

```bash
cp docs/PHASE1J_LOCAL_TEST_RESULTS_TEMPLATE.json runtime-test-results.json
```

2. Run the local setup commands:

```bash
npm run doctor
npm install
npm run prisma:generate
npm run prisma:migrate -- --name wave5_phase1j_runtime_bug_fix_pack
npm run db:seed
npm run db:seed
npm run verify:runtime-full
npm run typecheck
npm run build
npm run dev
```

3. Update `runtime-test-results.json` with one of:

```text
passed
failed
blocked
not_run
```

4. Review results:

```bash
npm run review:local-results
```

## Bug-Fix Rule

A failed local runtime item should be fixed only after it is written into the results file with:

- command run
- expected result
- actual result
- error text
- suspected area
- fix applied
- retest result

This keeps the platform foundation controlled and traceable.
