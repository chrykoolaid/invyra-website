# Invyra Portal Workflow Link Recovery v1

Status: COMPLETE

## Issue

The Inventory Dashboard sprint cards displayed “Open workflow” links, but the links pointed to `#` and did not open a workflow screen.

## Fix

All Sprint 1–10 workflow cards now open visible portal workflow pages under `/app/workflows/`.

## Added Workflow Pages

- `/app/workflows/item-supplier-master.html` — Sprint 1 Item & Supplier Master
- `/app/workflows/inventory-ledger.html` — Sprint 2 Inventory Ledger
- `/app/workflows/procurement.html` — Sprint 3 Procurement
- `/app/workflows/receiving.html` — Sprint 4 Receiving
- `/app/workflows/transfers.html` — Sprint 5 Transfers
- `/app/workflows/loss-markdown.html` — Sprint 6 Waste / Damage / Expiry / Markdown
- `/app/workflows/consumption-cost-centers.html` — Sprint 7 Consumption & Cost Centers
- `/app/workflows/stocktakes.html` — Sprint 8 Stocktakes & Inventory Accuracy
- `/app/workflows/intelligence.html` — Sprint 9 Inventory Intelligence & Forecasting
- `/app/workflows/commercial-controls.html` — Sprint 10 Commercial Hardening Controls

## Verification Intent

- No sprint workflow card may point to `#`.
- Every dashboard sprint link must resolve to an existing static workflow page.
- Workflow pages must retain login/session protection through the portal demo session check.
- Workflow pages must show organisation, role, environment, device, licence, queue, sample records, and control flow.

## Commercial Note

These workflow pages are portal UX and validation previews. Production database write/post behaviour remains gated until runtime backend certification.
