import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd(), '..');
const dashboardPath = path.join(projectRoot, 'app', 'dashboard.html');
const workflowsDir = path.join(projectRoot, 'app', 'workflows');

function fail(message){
  console.error(`Portal workflow link verification failed: ${message}`);
  process.exit(1);
}

if(!fs.existsSync(dashboardPath)) fail('app/dashboard.html is missing');
if(!fs.existsSync(workflowsDir)) fail('app/workflows directory is missing');

const dashboard = fs.readFileSync(dashboardPath, 'utf8');
const required = [
  'item-supplier-master',
  'inventory-ledger',
  'procurement',
  'receiving',
  'transfers',
  'loss-markdown',
  'consumption-cost-centers',
  'stocktakes',
  'intelligence',
  'commercial-controls'
];

if(/<a\s+href="#"[^>]*>Open workflow<\/a>/.test(dashboard)){
  fail('dashboard still contains dead Open workflow links');
}

for(const slug of required){
  const href = `/app/workflows/${slug}.html`;
  const filePath = path.join(workflowsDir, `${slug}.html`);
  if(!dashboard.includes(href)) fail(`dashboard is missing ${href}`);
  if(!fs.existsSync(filePath)) fail(`workflow page is missing: ${href}`);
  const page = fs.readFileSync(filePath, 'utf8');
  for(const token of ['data-demo-dashboard', 'portal-app-topbar', 'Workflow queue', 'Control flow', 'Back to dashboard']){
    if(!page.includes(token)) fail(`${href} is missing required token: ${token}`);
  }
}

console.log('Portal workflow link verification passed. Sprint 1–10 workflow cards open visible portal pages.');
