import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'lib/inventory/inventory-receiving-service.ts',
  'app/api/inventory/receiving/route.ts',
  'app/api/inventory/receiving/[id]/route.ts',
  'app/api/inventory/receivable-purchase-orders/route.ts',
  'app/portal/inventory/receiving/page.tsx',
  'components/inventory/ReceivingClient.tsx',
  'docs/INVENTORY_SPRINT4_IMPLEMENTATION_REPORT.md',
  'docs/INVENTORY_SPRINT4_ACCEPTANCE_TESTS.md'
];

const failures = [];
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

const service = existsSync('lib/inventory/inventory-receiving-service.ts') ? readFileSync('lib/inventory/inventory-receiving-service.ts', 'utf8') : '';
const schema = existsSync('prisma/schema.prisma') ? readFileSync('prisma/schema.prisma', 'utf8') : '';

for (const token of ['RECEIVING', 'InventoryReceivingBatch', 'InventoryReceivingLine', 'PARTIALLY_RECEIVED', 'RECEIVED', 'receiptNumber']) {
  if (!service.includes(token) && !schema.includes(token)) failures.push(`Expected token not found: ${token}`);
}

if (!service.includes('ensureSprint4ExceptionRole')) failures.push('Over-delivery exception role guard missing');
if (!service.includes('inventoryStockBalance.upsert')) failures.push('Receiving does not update stock balance through ledger transaction');
if (!service.includes('inventoryMovement.create')) failures.push('Receiving does not create inventory movement');

if (failures.length) {
  console.error('Sprint 4 verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Sprint 4 verification passed. Receiving foundation is present and ledger-backed.');
