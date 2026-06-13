#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const resultsPath = path.join(root, 'runtime-test-results.json');
const templatePath = path.join(root, 'docs', 'PHASE1J_LOCAL_TEST_RESULTS_TEMPLATE.json');

const requiredSections = [
  'install',
  'prisma',
  'seed',
  'runtime',
  'auth',
  'roles',
  'environments',
  'devices',
  'licensing',
  'audit'
];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`${path.relative(root, filePath)} is not valid JSON: ${error.message}`);
  }
}

function statusIcon(status) {
  if (status === 'passed') return '✅';
  if (status === 'failed') return '❌';
  if (status === 'blocked') return '🟡';
  return '⚪';
}

function printReview(data, sourceLabel) {
  console.log('\nInvyra Wave 5 Phase 1J first local test results review');
  console.log('=======================================================');
  console.log(`Source: ${sourceLabel}`);

  let failures = 0;
  let blocked = 0;
  let missing = 0;

  for (const section of requiredSections) {
    const entry = data[section];
    if (!entry) {
      missing += 1;
      console.log(`❌ ${section}: missing`);
      continue;
    }

    const status = entry.status ?? 'not_run';
    if (status === 'failed') failures += 1;
    if (status === 'blocked') blocked += 1;

    console.log(`${statusIcon(status)} ${section}: ${status}`);
    if (entry.notes) console.log(`   notes: ${entry.notes}`);
    if (Array.isArray(entry.errors) && entry.errors.length > 0) {
      for (const err of entry.errors) console.log(`   error: ${err}`);
    }
  }

  console.log('=======================================================');
  console.log(`Failed sections: ${failures}`);
  console.log(`Blocked sections: ${blocked}`);
  console.log(`Missing sections: ${missing}`);

  if (missing > 0 || failures > 0) process.exitCode = 1;
}

if (fs.existsSync(resultsPath)) {
  printReview(readJson(resultsPath), 'runtime-test-results.json');
} else if (fs.existsSync(templatePath)) {
  console.log('No runtime-test-results.json found. Showing the Phase 1J template instead.');
  console.log('Copy docs/PHASE1J_LOCAL_TEST_RESULTS_TEMPLATE.json to runtime-test-results.json after local testing.');
  printReview(readJson(templatePath), 'docs/PHASE1J_LOCAL_TEST_RESULTS_TEMPLATE.json');
} else {
  console.error('No runtime-test-results.json or Phase 1J template found.');
  process.exit(1);
}
