#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let passed = 0;
let failed = 0;

function ok(label) { console.log(`✅ ${label}`); passed += 1; }
function fail(label) { console.log(`❌ ${label}`); failed += 1; }
function fileExists(rel) { fs.existsSync(path.join(root, rel)) ? ok(`file exists: ${rel}`) : fail(`missing file: ${rel}`); }
function contains(rel, needle) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return fail(`missing file for content check: ${rel}`);
  const text = fs.readFileSync(full, 'utf8');
  text.includes(needle) ? ok(`${rel} contains ${needle}`) : fail(`${rel} missing ${needle}`);
}
function jsonContainsScript(script) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  pkg.scripts?.[script] ? ok(`package script exists: ${script}`) : fail(`package script missing: ${script}`);
}

console.log('\nInvyra Wave 5 Phase 1J verification');
console.log('=====================================');

[
  'scripts/first-local-test-review.mjs',
  'scripts/verify-phase1j.mjs',
  'docs/WAVE5_PHASE1J_BUILD_NOTES.md',
  'docs/PHASE1J_ACCEPTANCE_TESTS.md',
  'docs/PHASE1J_RUNTIME_BUG_FIX_PACK.md',
  'docs/PHASE1J_FIRST_LOCAL_TEST_REVIEW.md',
  'docs/PHASE1J_LOCAL_TEST_RESULTS_TEMPLATE.json',
  'docs/WAVE5_PHASE1J_COMPLETION_REPORT.md',
  'README.md',
  'package.json',
  '.env.example',
  'prisma/schema.prisma',
  'prisma/seed.ts'
].forEach(fileExists);

['review:local-results', 'verify:phase1j', 'verify:local', 'verify:runtime-full', 'doctor', 'db:seed', 'typecheck', 'build'].forEach(jsonContainsScript);

contains('package.json', '0.1.0-wave5-phase1j');
contains('.env.example', 'Wave 5 Phase 1J');
contains('scripts/first-local-test-review.mjs', 'runtime-test-results.json');
contains('scripts/first-local-test-review.mjs', 'requiredSections');
contains('docs/PHASE1J_RUNTIME_BUG_FIX_PACK.md', 'Known first-run issue checklist');
contains('docs/PHASE1J_FIRST_LOCAL_TEST_REVIEW.md', 'First Local Test Results Review');
contains('docs/PHASE1J_ACCEPTANCE_TESTS.md', 'No live CRM');
contains('docs/PHASE1J_ACCEPTANCE_TESTS.md', 'No live Inventory');
contains('docs/PHASE1J_ACCEPTANCE_TESTS.md', 'No live POS');
contains('docs/WAVE5_PHASE1J_COMPLETION_REPORT.md', 'Phase 1J');
contains('README.md', 'Wave 5 Phase 1J');
contains('README.md', 'npm run review:local-results');

console.log('=====================================');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) process.exit(1);
