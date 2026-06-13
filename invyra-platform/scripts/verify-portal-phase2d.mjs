import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mustExist = [
  'docs/PORTAL_BUILD_PHASE2D_IMPLEMENTATION_REPORT.md',
  'docs/PORTAL_BUILD_PHASE2D_ACCEPTANCE_TESTS.md',
  'docs/INVENTORY_PRISMA_SCHEMA_ACTIVATION_PLAN.md',
  'docs/INVENTORY_PRISMA_SCHEMA_ACTIVATION_CHECKLIST.md',
  'docs/INVENTORY_PRISMA_MIGRATION_SAFETY_RULES.md',
  'docs/INVENTORY_PRISMA_ROLLBACK_STRATEGY.md',
  'docs/INVENTORY_PRISMA_SCHEMA_ACTIVATION_CANDIDATE.prisma',
  'docs/INVENTORY_SEED_ACTIVATION_PLAN.md',
  'docs/PORTAL_PHASE2D_SCHEMA_ACTIVATION_MANIFEST.json',
  'docs/INVENTORY_PRISMA_SCHEMA_DRAFT.prisma',
  'docs/INVENTORY_DATA_MODEL_CONTRACT.md',
  'docs/INVENTORY_READ_ONLY_API_CONTRACT.md',
  'scripts/verify-portal-phase2d.mjs'
];

const failures = [];
for (const rel of mustExist) {
  if (!fs.existsSync(path.join(root, rel))) failures.push(`Missing required file: ${rel}`);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const phase2eActivated = fs.existsSync(path.join(root, 'docs/PORTAL_PHASE2E_SCHEMA_ACTIVATION_MANIFEST.json'));

if (!phase2eActivated && fs.existsSync(path.join(root, 'prisma/schema.prisma'))) {
  const schema = read('prisma/schema.prisma');
  const prohibitedLiveModels = [
    'model InventoryItem',
    'model InventoryStockBalance',
    'model InventoryMovement',
    'model InventorySupplier',
    'model InventoryImportBatch'
  ];
  for (const marker of prohibitedLiveModels) {
    if (schema.includes(marker)) failures.push(`Live prisma/schema.prisma was modified with ${marker}; Phase 2D must remain activation-plan only.`);
  }
}

const candidate = read('docs/INVENTORY_PRISMA_SCHEMA_ACTIVATION_CANDIDATE.prisma');
for (const marker of ['model InventoryItem', 'model InventorySupplier', 'model InventoryMovement', 'organisationId', 'environmentName']) {
  if (!candidate.includes(marker)) failures.push(`Activation candidate missing expected marker: ${marker}`);
}

const plan = read('docs/INVENTORY_PRISMA_SCHEMA_ACTIVATION_PLAN.md');
for (const marker of ['Phase 2E', 'npx prisma migrate dev', 'Do not enable writes']) {
  if (!plan.includes(marker)) failures.push(`Activation plan missing expected marker: ${marker}`);
}

const safety = read('docs/INVENTORY_PRISMA_MIGRATION_SAFETY_RULES.md');
for (const marker of ['LIVE, TRAINING, and TEST', 'No fake', 'organisationId + environmentName']) {
  if (!safety.includes(marker)) failures.push(`Migration safety rules missing expected marker: ${marker}`);
}

const manifest = JSON.parse(read('docs/PORTAL_PHASE2D_SCHEMA_ACTIVATION_MANIFEST.json'));
if (manifest.liveSchemaEdited !== false) failures.push('Manifest must state liveSchemaEdited=false.');
if (manifest.migrationGenerated !== false) failures.push('Manifest must state migrationGenerated=false.');
if (manifest.writesEnabled !== false) failures.push('Manifest must state writesEnabled=false.');

const pkg = JSON.parse(read('package.json'));
if (pkg.scripts?.['verify:portal-phase2d'] !== 'node scripts/verify-portal-phase2d.mjs') {
  failures.push('package.json missing verify:portal-phase2d script.');
}

if (failures.length) {
  console.error('Portal Phase 2D verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Portal Phase 2D verification passed.');
if (phase2eActivated) console.log('Phase 2D activation-plan checks passed in superseded mode because Phase 2E schema activation is present.');
else console.log('Phase 2D schema activation plan checks passed.');
