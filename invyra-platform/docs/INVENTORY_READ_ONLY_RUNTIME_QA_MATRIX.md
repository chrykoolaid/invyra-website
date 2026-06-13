# Inventory Read-only Runtime QA Matrix — Phase 2H

| Area | Check | Expected |
| --- | --- | --- |
| Session | Logged-out `/portal/inventory` | Redirect to login |
| Portal | Owner `/portal/inventory` | Loads |
| Portal | Owner workflow routes | Load or controlled access response |
| API | Logged-out `/api/inventory/items` | Redirect/401/403, not public data |
| API | Owner `/api/inventory/readiness` | JSON response |
| API | Owner `/api/inventory/items` | JSON response, zero or real rows |
| API | Owner `/api/inventory/suppliers` | JSON response, zero or real rows |
| API | Owner `/api/inventory/movements` | JSON response, zero or real rows |
| API | Owner `/api/inventory/configuration` | JSON response if admin |
| Boundary | POST to read-only API routes | Not enabled |
| Boundary | Import/upload routes | Must not exist |
| Boundary | CRM/POS launch | Must remain future-only |
