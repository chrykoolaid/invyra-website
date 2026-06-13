# Inventory Sprint 6 — Waste / Damage / Expiry / Markdown Implementation Report

Status: LOCK READY

## Implemented Scope

- InventoryLossEvent model for wastage, damage, expiry, shrinkage, and markdown-related loss capture.
- InventoryMarkdownEvent model for two-part markdown label/barcode workflow governance.
- Loss service with role checks, tenant/environment scoping, item/location validation, and negative stock protection.
- Ledger integration for WASTAGE and SHRINKAGE movements where stock is physically reduced.
- Markdown tracking remains price/label controlled and does not mutate stock until sold/expired/closed by later POS or expiry workflow.
- API routes for loss events, markdowns, and loss dashboard.
- Audit actions for loss and markdown recording.

## Safety Boundaries

- Loss events cannot cross organisation or environment.
- Archived items are blocked.
- Negative stock creation is blocked.
- Markdown labels are advisory/operational labels and do not silently change on-hand stock.

## Commercial Rule

Waste, damage, expiry, markdown, and shrinkage are separated so customers can distinguish physical loss, sell-through markdown action, and stock ledger impact.
