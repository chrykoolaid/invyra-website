# Portal Build Phase 1G — Acceptance Tests

## Scope

Phase 1G verifies setup-action and data-import preparation routes for the Inventory-first protected portal.

---

## Required Checks

### Route checks

```text
/portal/inventory/setup exists
/portal/inventory/imports exists
```

Both routes must:

```text
require a session
require INVENTORY.VIEW access
render inside PortalShell
show environment context
avoid fake operational data
```

### Navigation checks

PortalShell Inventory navigation must include:

```text
Readiness
Setup Actions
Data Import Prep
```

Inventory Dashboard must link to:

```text
/portal/inventory/setup
/portal/inventory/imports
```

Readiness and workflow pages must also link to setup/import preparation.

### Setup action checks

Setup Actions must show:

```text
organisation profile
Inventory licence
role and permission access
environment separation
team access
device preparation
workflow route shells
data import templates
backend connection boundary
```

### Import preparation checks

Import Preparation must show template guidance for:

```text
Item Master Import
Supplier Import
Opening Stock Balance Import
Reorder Level Import
Supplier Item Mapping Import
```

Each template should show:

```text
required columns
optional columns
validation rules
safety rules
backend boundary
```

### Forbidden checks

Phase 1G must not include:

```text
<input type="file">
upload handler
CSV parser
spreadsheet parser
createMany
live item creation
live supplier creation
stock mutation
purchase order generation
fake stock rows
fake supplier rows
fake order rows
```

---

## Verification Command

Run from `invyra-platform`:

```bash
npm run verify:portal-phase1g
```

Expected result:

```text
Portal Phase 1G verification passed.
Phase 1G setup actions and import preparation checks passed.
```
