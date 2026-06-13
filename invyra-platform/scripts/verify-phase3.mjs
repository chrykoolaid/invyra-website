#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const checks = [];

function check(label, condition) {
  checks.push({ label, passed: Boolean(condition) });
}

function file(path) {
  return join(root, path);
}

function contains(path, needle) {
  if (!existsSync(file(path))) return false;
  return readFileSync(file(path), 'utf8').includes(needle);
}

const requiredDocs = [
  'docs/WAVE5_PHASE3_BUILD_NOTES.md',
  'docs/PRODUCTION_READINESS_ARCHITECTURE.md',
  'docs/BACKUP_RECOVERY_RUNBOOK.md',
  'docs/MONITORING_LOGGING_PLAN.md',
  'docs/RELEASE_MANAGEMENT_RUNBOOK.md',
  'docs/PHASE3_PRODUCTION_READINESS_CHECKLIST.md',
  'docs/PHASE3_ACCEPTANCE_TESTS.md',
  'docs/WAVE5_PHASE3_COMPLETION_REPORT.md'
];

for (const doc of requiredDocs) {
  check(`${doc} exists`, existsSync(file(doc)));
}

check('Production architecture separates deployment and product environments', contains('docs/PRODUCTION_READINESS_ARCHITECTURE.md', 'Development / Staging / Production') && contains('docs/PRODUCTION_READINESS_ARCHITECTURE.md', 'LIVE / TRAINING / TEST'));
check('Backup runbook documents restore procedure', contains('docs/BACKUP_RECOVERY_RUNBOOK.md', 'Restore Procedure'));
check('Backup runbook protects LIVE separation', contains('docs/BACKUP_RECOVERY_RUNBOOK.md', 'Never restore TEST or TRAINING records into LIVE'));
check('Monitoring plan includes access denied security monitoring', contains('docs/MONITORING_LOGGING_PLAN.md', 'Access denied'));
check('Release runbook requires rollback plan', contains('docs/RELEASE_MANAGEMENT_RUNBOOK.md', 'Rollback plan'));
check('Production checklist includes organisation scoping', contains('docs/PHASE3_PRODUCTION_READINESS_CHECKLIST.md', 'Organisation scoping'));
check('Acceptance tests keep live modules out of scope', contains('docs/PHASE3_ACCEPTANCE_TESTS.md', 'No live CRM'));
check('Completion report recommends Wave 5 complete lock', contains('docs/WAVE5_PHASE3_COMPLETION_REPORT.md', 'STATUS: COMPLETE'));
check('package.json exposes verify:phase3', contains('package.json', '"verify:phase3"'));
check('package.json verify targets Phase 3', contains('package.json', 'npm run verify:phase3'));
check('README references Phase 3', contains('README.md', 'Wave 5 Phase 3'));
check('README references production readiness', contains('README.md', 'Production Readiness'));

const failed = checks.filter((item) => !item.passed);

for (const item of checks) {
  console.log(`${item.passed ? '✅' : '❌'} ${item.label}`);
}

console.log(`\nPhase 3 verification: ${checks.length - failed.length} passed, ${failed.length} failed.`);

if (failed.length > 0) {
  process.exit(1);
}
