export type InventoryWorkflowLayout = {
  workflowId: string;
  layoutLabel: string;
  workspaceTitle: string;
  workspaceDescription: string;
  primaryZoneTitle: string;
  primaryZoneDescription: string;
  secondaryZoneTitle: string;
  secondaryZoneDescription: string;
  emptyStateTitle: string;
  emptyStateCopy: string;
  plannedColumns: string[];
  plannedActions: string[];
  workflowPanels: Array<{
    title: string;
    description: string;
    items: string[];
  }>;
  backendContract: string[];
  safetyRules: string[];
};

const defaultLayout: InventoryWorkflowLayout = {
  workflowId: "default",
  layoutLabel: "Inventory workflow layout",
  workspaceTitle: "Workflow Workspace",
  workspaceDescription: "Prepared portal workspace for an Inventory workflow before backend data connection.",
  primaryZoneTitle: "Primary Workspace",
  primaryZoneDescription: "This area is reserved for the main workflow table, queue, or form once the backend is connected.",
  secondaryZoneTitle: "Detail Panel",
  secondaryZoneDescription: "This area is reserved for selected-record details, guidance, and controlled actions.",
  emptyStateTitle: "No live Inventory data connected yet",
  emptyStateCopy: "This page is a protected portal layout only. It does not display fake stock, supplier, order, or movement data.",
  plannedColumns: ["Record", "Status", "Environment", "Last Updated"],
  plannedActions: ["Connect backend source", "Add filters", "Add role-gated actions"],
  workflowPanels: [
    {
      title: "Workflow Readiness",
      description: "The route and permission guard are prepared before operational data is connected.",
      items: ["Protected route active", "Inventory licence guard active", "Environment awareness visible"]
    }
  ],
  backendContract: ["Read scoped organisation data", "Respect environment separation", "Write audit events for operational actions"],
  safetyRules: ["No fake backend claim", "No live-stock mutation from portal shell", "No training/test data mixed into LIVE"]
};

export const inventoryWorkflowLayouts: Record<string, InventoryWorkflowLayout> = {
  items: {
    workflowId: "items",
    layoutLabel: "Item Master Workspace",
    workspaceTitle: "Item Master Layout",
    workspaceDescription: "Prepared for browsing, searching, and eventually maintaining the organisation item catalogue.",
    primaryZoneTitle: "Item Catalogue Area",
    primaryZoneDescription: "Future list/table for item names, SKUs, units, barcodes, stock state, and item status.",
    secondaryZoneTitle: "Selected Item Details",
    secondaryZoneDescription: "Future side panel for item identity, supplier links, reorder settings, and environment-specific stock visibility.",
    emptyStateTitle: "Item catalogue not connected yet",
    emptyStateCopy: "No sample SKUs are shown because this portal shell is not connected to the live Inventory item master yet.",
    plannedColumns: ["SKU / Code", "Item Name", "Unit", "On Hand", "Reorder Point", "Supplier", "Status"],
    plannedActions: ["Add Item", "Edit Selected", "Import Items", "Review Thresholds", "Export Catalogue"],
    workflowPanels: [
      {
        title: "Catalogue Structure",
        description: "Prepared for item identity before stock movements are allowed.",
        items: ["SKU and barcode identity", "Unit of measure", "Supplier relationship", "Reorder settings"]
      },
      {
        title: "Permission Direction",
        description: "View access can see items; create/edit will require stronger permissions later.",
        items: ["Staff: view allowed when licensed", "Manager/Admin: future edit control", "Admin: import and threshold governance"]
      }
    ],
    backendContract: ["Read organisation-scoped item records", "Hydrate per-environment stock values", "Block item mutation without Inventory manage/admin permission"],
    safetyRules: ["Do not create silent stock movements on item creation", "Do not mix TRAINING item records into LIVE", "Show threshold-missing state instead of guessing"]
  },
  movements: {
    workflowId: "movements",
    layoutLabel: "Movement Ledger Workspace",
    workspaceTitle: "Inventory Movement Ledger Layout",
    workspaceDescription: "Prepared for a read-only ledger first, then controlled adjustment actions after backend scope.",
    primaryZoneTitle: "Movement Ledger Area",
    primaryZoneDescription: "Future ledger for receiving, wastage, store use, stocktake adjustments, and manual corrections.",
    secondaryZoneTitle: "Movement Detail / Audit Trace",
    secondaryZoneDescription: "Future details area for reference numbers, source workflow, user, terminal/device, and audit trail.",
    emptyStateTitle: "Movement ledger not connected yet",
    emptyStateCopy: "No fabricated movement rows are shown. Live ledger rows require backend Inventory movement integration.",
    plannedColumns: ["Date", "Reference", "Item", "Movement Type", "Quantity", "Source", "User", "Environment"],
    plannedActions: ["Filter Ledger", "Export Movements", "View Audit Detail", "Create Adjustment"],
    workflowPanels: [
      {
        title: "Ledger Priority",
        description: "The first operational version should be audit-safe and read-heavy.",
        items: ["Reference-first layout", "Source workflow trace", "Environment separation", "Export governance"]
      },
      {
        title: "Adjustment Governance",
        description: "Adjustment actions must be gated and auditable when added.",
        items: ["Reason required", "Manager approval where needed", "No silent quantity changes"]
      }
    ],
    backendContract: ["Read movement records by organisation and environment", "Link movements to source documents", "Audit every manual adjustment"],
    safetyRules: ["Read-only first", "No hidden movement mutation", "LIVE movement exports must exclude TRAINING/TEST"]
  },
  suppliers: {
    workflowId: "suppliers",
    layoutLabel: "Supplier Directory Workspace",
    workspaceTitle: "Supplier Management Layout",
    workspaceDescription: "Prepared for supplier records, purchasing contacts, and supplier-to-item relationships.",
    primaryZoneTitle: "Supplier Directory Area",
    primaryZoneDescription: "Future list for supplier names, contact details, ordering channels, and active status.",
    secondaryZoneTitle: "Supplier Detail / Item Links",
    secondaryZoneDescription: "Future detail panel for linked items, lead times, ordering rules, and communication history.",
    emptyStateTitle: "Supplier directory not connected yet",
    emptyStateCopy: "No placeholder suppliers are displayed. Supplier records must come from the Inventory backend.",
    plannedColumns: ["Supplier", "Contact", "Phone", "Email", "Linked Items", "Lead Time", "Status"],
    plannedActions: ["Add Supplier", "Edit Supplier", "Link Items", "Review Lead Times", "Prepare Supplier Portal"],
    workflowPanels: [
      {
        title: "Purchasing Foundation",
        description: "Supplier data becomes the backbone for reorder review and order creation.",
        items: ["Supplier profile", "Preferred ordering method", "Lead-time setup", "Item mapping"]
      },
      {
        title: "Future Collaboration",
        description: "Supplier confirmation and discrepancy communication come after core supplier records.",
        items: ["Order confirmation", "Delivery status", "Receiving discrepancy communication"]
      }
    ],
    backendContract: ["Read supplier records by organisation", "Persist supplier-to-item mappings", "Keep supplier communication separated by environment"],
    safetyRules: ["No supplier email automation until explicitly scoped", "No LIVE order submission from TRAINING", "No fake supplier status claims"]
  },
  orders: {
    workflowId: "orders",
    layoutLabel: "Purchase Order Command Workspace",
    workspaceTitle: "Orders Queue + Draft Workspace Layout",
    workspaceDescription: "Prepared for the queue-to-workspace order model used by Inventory purchasing.",
    primaryZoneTitle: "Orders Queue Area",
    primaryZoneDescription: "Future queue for draft, submitted, approved, rejected, partially received, and closed purchase orders.",
    secondaryZoneTitle: "Draft / Tracking Workspace",
    secondaryZoneDescription: "Future inline workspace for order details, line review, final submit, approval, amendments, and delivery tracking.",
    emptyStateTitle: "Orders backend not connected yet",
    emptyStateCopy: "No demo orders are shown. Purchase orders must come from the scoped Inventory purchasing backend.",
    plannedColumns: ["Order #", "Supplier", "Status", "Lines", "Expected Date", "Created By", "Environment"],
    plannedActions: ["Manual Order", "Create From Reorder Review", "Submit Order", "Approve / Reject", "Track Receiving"],
    workflowPanels: [
      {
        title: "Locked Workflow Direction",
        description: "Orders should keep the queue-to-workspace model rather than popup-heavy handling.",
        items: ["Click order to open inline workspace", "Return to queue", "Three-step draft process", "Submit then tracking mode"]
      },
      {
        title: "Approval Safety",
        description: "Approvals must stay explicit and role-gated.",
        items: ["Approve/Reject only in final review", "Amendments visible before submit", "Receiving does stock impact later"]
      }
    ],
    backendContract: ["Read purchase orders by organisation/environment", "Persist draft packages and line amendments", "Create movements only through receiving, not order creation"],
    safetyRules: ["TRAINING orders never submit to LIVE suppliers", "No stock mutation at order creation", "Approval actions require role checks"]
  },
  receiving: {
    workflowId: "receiving",
    layoutLabel: "Receiving Workspace",
    workspaceTitle: "Receiving + Discrepancy Layout",
    workspaceDescription: "Prepared for receiving against purchase orders and capturing supplier delivery discrepancies.",
    primaryZoneTitle: "Receiving Queue Area",
    primaryZoneDescription: "Future queue for expected deliveries, partial receipts, received lines, and variance status.",
    secondaryZoneTitle: "Receiving Confirmation Panel",
    secondaryZoneDescription: "Future confirmation area for received quantities, damaged goods, missing items, notes, and attachments.",
    emptyStateTitle: "Receiving queue not connected yet",
    emptyStateCopy: "No delivery records are shown until purchase orders and receiving backend workflows are connected.",
    plannedColumns: ["PO #", "Supplier", "Expected", "Received", "Variance", "Discrepancy", "Status"],
    plannedActions: ["Open Delivery", "Confirm Quantities", "Record Discrepancy", "Upload Evidence", "Post Receiving Movement"],
    workflowPanels: [
      {
        title: "Receiving Rules",
        description: "Receiving is the correct point where purchase orders can eventually affect stock.",
        items: ["Receive against PO", "Handle partial receipt", "Capture discrepancy", "Create movement after confirmation"]
      },
      {
        title: "Supplier Communication",
        description: "Discrepancy notes and uploads should later sync to supplier-facing workflows.",
        items: ["Missing goods", "Damaged goods", "Wrong item", "Evidence upload"]
      }
    ],
    backendContract: ["Read expected deliveries", "Persist received quantities", "Create stock-in movement only after confirmed receiving"],
    safetyRules: ["No LIVE stock increase from TRAINING", "Discrepancies must be visible before close", "Attachments require scoped storage later"]
  },
  wastage: {
    workflowId: "wastage",
    layoutLabel: "Wastage Capture Workspace",
    workspaceTitle: "Wastage Capture Layout",
    workspaceDescription: "Prepared for damaged, expired, lost, or unusable stock events with audit visibility.",
    primaryZoneTitle: "Wastage Event Area",
    primaryZoneDescription: "Future list for pending, approved, rejected, and posted wastage events.",
    secondaryZoneTitle: "Capture / Approval Panel",
    secondaryZoneDescription: "Future form for item, quantity, reason, evidence, approval state, and movement posting.",
    emptyStateTitle: "Wastage events not connected yet",
    emptyStateCopy: "No wastage events are invented. Real wastage requires backend capture and approval wiring.",
    plannedColumns: ["Date", "Item", "Quantity", "Reason", "Status", "Approved By", "Environment"],
    plannedActions: ["Record Wastage", "Attach Evidence", "Submit For Review", "Approve", "Post Stock Reduction"],
    workflowPanels: [
      {
        title: "Reason Structure",
        description: "Wastage needs clean categories before reporting and stock movement creation.",
        items: ["Damaged", "Expired", "Spoiled", "Lost", "Other controlled reason"]
      },
      {
        title: "Stock Safety",
        description: "Stock reduction should happen only through an approved and audited event.",
        items: ["Approval path", "Evidence optional/required by policy", "Movement linkage"]
      }
    ],
    backendContract: ["Create wastage records", "Apply role-gated approval", "Post stock-out movements only after approval policy is satisfied"],
    safetyRules: ["No instant hidden stock decrement", "Training wastage cannot distort LIVE reporting", "Reason is required before posting"]
  },
  "store-use": {
    workflowId: "store-use",
    layoutLabel: "Store Use Workspace",
    workspaceTitle: "Internal Store Use Layout",
    workspaceDescription: "Prepared for non-sale consumption of stock inside the business operation.",
    primaryZoneTitle: "Store Use Event Area",
    primaryZoneDescription: "Future list of internal usage records such as cleaning supplies, samples, operational consumption, or staff-use stock.",
    secondaryZoneTitle: "Usage Capture Panel",
    secondaryZoneDescription: "Future capture area for item, quantity, use category, department/location, and approval requirement.",
    emptyStateTitle: "Store-use events not connected yet",
    emptyStateCopy: "No internal use data is shown until the store-use backend workflow is explicitly connected.",
    plannedColumns: ["Date", "Item", "Quantity", "Use Category", "Location", "Captured By", "Status"],
    plannedActions: ["Record Store Use", "Choose Category", "Submit For Review", "Post Stock Reduction", "Export Usage"],
    workflowPanels: [
      {
        title: "Usage Categories",
        description: "Clear categories prevent store use from being confused with wastage or sales.",
        items: ["Operations", "Cleaning/maintenance", "Sample/demo", "Internal transfer/use"]
      },
      {
        title: "Cost Visibility",
        description: "Later reporting should separate operational consumption from shrinkage and customer sales.",
        items: ["Cost allocation", "Location context", "User traceability"]
      }
    ],
    backendContract: ["Persist store-use records", "Post stock-out movement after validation", "Separate store-use reports from wastage reports"],
    safetyRules: ["No stock decrement without reason/category", "No LIVE mutation in TRAINING", "Keep store use separate from sales"]
  },
  "reorder-review": {
    workflowId: "reorder-review",
    layoutLabel: "Reorder Review Workspace",
    workspaceTitle: "Replenishment Review Layout",
    workspaceDescription: "Prepared for reviewing what should be ordered before draft purchase orders are created.",
    primaryZoneTitle: "Recommendation Review Area",
    primaryZoneDescription: "Future table for low stock, coverage, supplier grouping, suggested quantities, and review decisions.",
    secondaryZoneTitle: "Draft Package Panel",
    secondaryZoneDescription: "Future panel for consolidating reviewed recommendations into supplier draft orders.",
    emptyStateTitle: "Recommendations not connected yet",
    emptyStateCopy: "No suggested quantities are guessed here. Recommendations require stock, thresholds, demand history, and supplier mappings.",
    plannedColumns: ["Risk", "Item", "On Hand", "Demand", "Days Left", "Suggested Qty", "Supplier", "Decision"],
    plannedActions: ["Generate Recommendations", "Review Selected", "Adjust Suggested Qty", "Create Draft Orders", "Send To Orders"],
    workflowPanels: [
      {
        title: "Decision Support",
        description: "This should help managers understand reorder pressure without auto-ordering blindly.",
        items: ["Risk and flag chips", "Coverage days", "Supplier grouping", "Threshold missing notices"]
      },
      {
        title: "Purchasing Handoff",
        description: "Approved recommendations should hand off to Orders as consolidated draft packages.",
        items: ["One draft package per review", "Supplier attribution preserved", "Manual review before submit"]
      }
    ],
    backendContract: ["Read live stock and thresholds", "Calculate demand/coverage from movement history", "Create draft order packages without submitting to suppliers"],
    safetyRules: ["Do not guess reorder quantities without inputs", "Do not auto-submit orders", "Show threshold-missing states clearly"]
  },
  "gap-scan": {
    workflowId: "gap-scan",
    layoutLabel: "Gap Scan Workspace",
    workspaceTitle: "Inventory Risk Scan Layout",
    workspaceDescription: "Prepared for identifying stock gaps, coverage risks, and threshold exceptions.",
    primaryZoneTitle: "Scan Results Area",
    primaryZoneDescription: "Future results list for risk level, item, on-hand, demand, days left, and suggested review action.",
    secondaryZoneTitle: "Selected Issue Explanation",
    secondaryZoneDescription: "Future explanation panel for why an item is flagged and what data is missing or risky.",
    emptyStateTitle: "Gap scan engine not connected yet",
    emptyStateCopy: "No risk results are fabricated. Gap Scan requires inventory records, thresholds, and movement history.",
    plannedColumns: ["Risk", "Flag", "Item", "On Hand", "Demand 30D", "Days Left", "Suggested", "Coverage Days"],
    plannedActions: ["Run Scan", "Explain Selected", "Export Scan", "Send To Reorder Review", "Review Threshold Gaps"],
    workflowPanels: [
      {
        title: "Risk Language",
        description: "Gap Scan should remain clear and not overwhelm users with raw analytics.",
        items: ["Out of stock", "Low coverage", "Threshold missing", "Unusual movement pattern"]
      },
      {
        title: "No AI Masking",
        description: "AI or explanations must not hide incomplete inventory data.",
        items: ["Show missing inputs", "Explain calculation basis", "Avoid confident guesses"]
      }
    ],
    backendContract: ["Read item stock and movement history", "Calculate risk with transparent inputs", "Export results with environment and timestamp"],
    safetyRules: ["No fabricated risk results", "Training scans are practice only", "Flag missing thresholds instead of guessing"]
  },
  stocktake: {
    workflowId: "stocktake",
    layoutLabel: "Stocktake Workspace",
    workspaceTitle: "Stocktake Session Layout",
    workspaceDescription: "Prepared for controlled physical counts, variance review, and adjustment approval.",
    primaryZoneTitle: "Stocktake Session Area",
    primaryZoneDescription: "Future session list for count status, location, assigned users, variance count, and approval state.",
    secondaryZoneTitle: "Count / Variance Panel",
    secondaryZoneDescription: "Future panel for entering counts, reviewing variances, and posting approved adjustments.",
    emptyStateTitle: "Stocktake sessions not connected yet",
    emptyStateCopy: "No count sessions are displayed until stocktake backend workflows are introduced.",
    plannedColumns: ["Session", "Location", "Status", "Items Counted", "Variance", "Assigned To", "Approved By"],
    plannedActions: ["Start Stocktake", "Enter Counts", "Review Variance", "Approve Adjustment", "Post Movements"],
    workflowPanels: [
      {
        title: "Controlled Count Flow",
        description: "Stocktake must separate counting from approval and final stock posting.",
        items: ["Start session", "Count items", "Review variance", "Approve before posting"]
      },
      {
        title: "Variance Safety",
        description: "Unexpected differences should be reviewed before they change live balances.",
        items: ["Variance reason", "Manager approval", "Movement linkage"]
      }
    ],
    backendContract: ["Create stocktake sessions", "Persist count entries", "Post adjustment movements only after approval"],
    safetyRules: ["Do not overwrite stock silently", "TEST count sessions cannot affect LIVE", "Variance approval required before adjustment"]
  },
  reports: {
    workflowId: "reports",
    layoutLabel: "Inventory Reports Workspace",
    workspaceTitle: "Reports Library Layout",
    workspaceDescription: "Prepared for read-only operational reporting once backend Inventory data is connected.",
    primaryZoneTitle: "Report Library Area",
    primaryZoneDescription: "Future report cards for stock, movements, orders, receiving, wastage, store use, and audit visibility.",
    secondaryZoneTitle: "Report Preview / Export Controls",
    secondaryZoneDescription: "Future preview area for report filters, environment scope, export controls, and schedule options.",
    emptyStateTitle: "Reports not connected yet",
    emptyStateCopy: "No fake metrics, charts, or exports are shown before live report queries exist.",
    plannedColumns: ["Report", "Scope", "Environment", "Date Range", "Format", "Permission", "Status"],
    plannedActions: ["Open Report", "Set Date Range", "Export CSV", "Export PDF", "Schedule Report"],
    workflowPanels: [
      {
        title: "Initial Report Set",
        description: "Reports should start with operational Inventory visibility before advanced analytics.",
        items: ["Stock on hand", "Movement summary", "Purchase order summary", "Wastage and store use"]
      },
      {
        title: "Export Governance",
        description: "Exports must respect role permissions and environment scope.",
        items: ["Role-gated export", "Environment-labelled output", "Audit event on export"]
      }
    ],
    backendContract: ["Query reporting views by organisation/environment", "Generate exports with audit trail", "Keep LIVE reports distinct from TRAINING/TEST reports"],
    safetyRules: ["No fake dashboard numbers", "No cross-environment report leakage", "Export must be auditable"]
  },
  "training-mode": {
    workflowId: "training-mode",
    layoutLabel: "Training Workspace",
    workspaceTitle: "Training Mode Layout",
    workspaceDescription: "Prepared for safe staff practice scenarios that never affect LIVE stock.",
    primaryZoneTitle: "Training Scenario Area",
    primaryZoneDescription: "Future scenario list for item lookup, receiving practice, stocktake practice, and discrepancy handling.",
    secondaryZoneTitle: "Training Guidance Panel",
    secondaryZoneDescription: "Future step-by-step guidance, reset controls, and training audit visibility.",
    emptyStateTitle: "Training scenarios not connected yet",
    emptyStateCopy: "No practice datasets are active until Training Mode backend data and reset controls are scoped.",
    plannedColumns: ["Scenario", "Skill", "Difficulty", "Progress", "Reset Available", "Environment", "Status"],
    plannedActions: ["Start Scenario", "Reset Training Data", "Review Training Audit", "Practice Receiving", "Practice Stocktake"],
    workflowPanels: [
      {
        title: "Safe Practice Direction",
        description: "Training needs to be calm, clear, and impossible to confuse with LIVE operations.",
        items: ["Strong TRAINING banner", "Practice-only data", "Simple guided tasks", "Reset controls"]
      },
      {
        title: "Staff Onboarding",
        description: "Training Mode should support staff learning before live operational access.",
        items: ["Item lookup practice", "Receiving practice", "Wastage practice", "Stocktake practice"]
      }
    ],
    backendContract: ["Provision training-safe datasets", "Separate training audit log", "Support reset without touching LIVE data"],
    safetyRules: ["Never affect LIVE stock", "Never generate commercial documents", "Training data must be visibly labelled"]
  },
  "inventory-settings": {
    workflowId: "inventory-settings",
    layoutLabel: "Inventory Admin Workspace",
    workspaceTitle: "Inventory Settings Layout",
    workspaceDescription: "Prepared for administrator-only Inventory configuration and workflow controls.",
    primaryZoneTitle: "Settings Group Area",
    primaryZoneDescription: "Future settings groups for thresholds, workflows, scanner rules, training reset, supplier integrations, and permissions.",
    secondaryZoneTitle: "Configuration Detail Panel",
    secondaryZoneDescription: "Future detail form for selected settings with validation, change preview, and audit confirmation.",
    emptyStateTitle: "Inventory settings backend not connected yet",
    emptyStateCopy: "No editable settings are active. This page is guarded by INVENTORY.ADMINISTER and waits for explicit backend scope.",
    plannedColumns: ["Setting Group", "Environment", "Current State", "Requires Approval", "Last Changed", "Owner"],
    plannedActions: ["Edit Threshold Rules", "Configure Workflows", "Manage Scanner Rules", "Reset Training Dataset", "Review Change Log"],
    workflowPanels: [
      {
        title: "Admin Control Areas",
        description: "Settings should be grouped and not exposed as one confusing configuration dump.",
        items: ["Thresholds", "Workflow permissions", "Training reset", "Scanner/device behaviour"]
      },
      {
        title: "Change Safety",
        description: "Operational settings must be validated and auditable.",
        items: ["Environment selected first", "Validation before save", "Audit event on change", "Rollback notes where needed"]
      }
    ],
    backendContract: ["Read Inventory configuration by environment", "Validate changes before save", "Audit all configuration mutations"],
    safetyRules: ["Admin access required", "No settings change without environment context", "Do not silently alter LIVE workflow rules"]
  }
};

export function getInventoryWorkflowLayout(workflowId: string) {
  return inventoryWorkflowLayouts[workflowId] ?? defaultLayout;
}
