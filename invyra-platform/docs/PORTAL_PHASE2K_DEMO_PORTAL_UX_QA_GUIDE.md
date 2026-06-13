# Phase 2K — Read-only Demo Portal UX QA Guide

Use this guide after running the Phase 2I demo seed and starting the local portal.

## What to Review

1. Open the protected Inventory Dashboard.
2. Confirm the Phase 2K demo UX banner is visible.
3. Confirm Items, Suppliers, Movements, and Configuration tables show either seeded demo rows or honest empty states.
4. Confirm every visible table states that it is read-only and demo-review only.
5. Open Items, Suppliers, Movements, and Inventory Settings workflow routes.
6. Confirm workflow tables use the same demo UX labels.
7. Confirm there are no Create, Edit, Delete, Upload, Import Commit, Receive, Approve, Submit, or Stock Adjustment buttons.

## Pass Condition

Demo data can be reviewed clearly, but the portal still cannot mutate Inventory records or stock.

## Fail Condition

Fail the phase if seeded rows appear to be operationally editable, if a write action is exposed, or if CRM/POS appear launchable.
