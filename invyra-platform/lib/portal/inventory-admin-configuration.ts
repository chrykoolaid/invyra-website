export type InventoryAdminConfigurationStatus = "shell-ready" | "disabled-control" | "backend-deferred";

export type InventoryAdminConfigurationSetting = {
  id: string;
  label: string;
  plannedControl: string;
  currentState: string;
  phaseBoundary: string;
};

export type InventoryAdminConfigurationGroup = {
  id: string;
  title: string;
  description: string;
  owner: string;
  status: InventoryAdminConfigurationStatus;
  environmentScope: string;
  settings: InventoryAdminConfigurationSetting[];
  safetyRules: string[];
  backendContract: string[];
};

export const inventoryAdminConfigurationGroups: InventoryAdminConfigurationGroup[] = [
  {
    id: "stock-rules",
    title: "Stock Rules",
    description: "Prepare organisation-level stock behaviour before live item and movement data is connected.",
    owner: "Inventory Admin",
    status: "disabled-control",
    environmentScope: "LIVE, TRAINING, and TEST must store separate stock rule values once persistence exists.",
    settings: [
      {
        id: "negative-stock-policy",
        label: "Negative Stock Policy",
        plannedControl: "Disabled select control",
        currentState: "Prepared only",
        phaseBoundary: "No stock validation engine is active in Phase 1H."
      },
      {
        id: "opening-balance-lock",
        label: "Opening Balance Lock After Go-Live",
        plannedControl: "Disabled toggle control",
        currentState: "Recommended: admin approval required",
        phaseBoundary: "No opening balance mutation is enabled here."
      },
      {
        id: "movement-reference-required",
        label: "Movement Reference Requirement",
        plannedControl: "Disabled rule selector",
        currentState: "Prepared for audit-first movement rules",
        phaseBoundary: "No movement save pipeline is connected."
      }
    ],
    safetyRules: [
      "Stock rule changes must be audited before persistence is enabled.",
      "TRAINING and TEST rule changes must not alter LIVE stock behaviour.",
      "Opening balance changes after go-live require explicit admin approval."
    ],
    backendContract: [
      "Read environment-scoped Inventory configuration.",
      "Validate stock rule changes before save.",
      "Write immutable audit log entries for configuration updates."
    ]
  },
  {
    id: "item-master",
    title: "Item Master Rules",
    description: "Prepare SKU, barcode, unit, image, and duplicate-prevention rules for item setup.",
    owner: "Inventory Admin / Manager",
    status: "disabled-control",
    environmentScope: "Item rule settings must be environment-aware before any item creation actions are enabled.",
    settings: [
      {
        id: "sku-required",
        label: "SKU Required",
        plannedControl: "Disabled toggle control",
        currentState: "Prepared for required item identity",
        phaseBoundary: "No item create/edit form is active."
      },
      {
        id: "barcode-mode",
        label: "Barcode Mode",
        plannedControl: "Disabled segmented control",
        currentState: "Prepared for manual, scanner, and future sync modes",
        phaseBoundary: "No barcode generation or scanner capture is connected."
      },
      {
        id: "item-image-policy",
        label: "Item Image Policy",
        plannedControl: "Disabled policy selector",
        currentState: "Prepared for catalogue image governance",
        phaseBoundary: "No upload or media storage is enabled."
      }
    ],
    safetyRules: [
      "Item identity rules must block duplicates before backend writes begin.",
      "Image upload must remain disabled until file storage and malware checks are scoped.",
      "Barcode settings must not imply POS catalogue readiness."
    ],
    backendContract: [
      "Add duplicate item detection.",
      "Validate SKU/barcode uniqueness by organisation and environment.",
      "Connect media storage only after upload governance exists."
    ]
  },
  {
    id: "supplier-purchasing",
    title: "Supplier & Purchasing Rules",
    description: "Prepare supplier ordering, manual PO, draft package, and approval settings.",
    owner: "Manager / Inventory Admin",
    status: "backend-deferred",
    environmentScope: "TRAINING purchase orders must never be sent to LIVE suppliers.",
    settings: [
      {
        id: "po-approval-required",
        label: "Purchase Order Approval Required",
        plannedControl: "Disabled toggle control",
        currentState: "Prepared for manager approval",
        phaseBoundary: "No PO submit, approve, or reject action is enabled."
      },
      {
        id: "manual-order-policy",
        label: "Manual Order Policy",
        plannedControl: "Disabled role rule selector",
        currentState: "Prepared for permission-gated manual orders",
        phaseBoundary: "No manual order write action exists in the portal."
      },
      {
        id: "supplier-confirmation-mode",
        label: "Supplier Confirmation Mode",
        plannedControl: "Disabled selector",
        currentState: "Prepared for future supplier status sync",
        phaseBoundary: "No supplier portal or outbound communication is connected."
      }
    ],
    safetyRules: [
      "Supplier submission must remain disabled until outbound communication is scoped.",
      "Approvals must be role-gated and audit-logged before activation.",
      "Draft packages must not mutate stock until receiving is completed."
    ],
    backendContract: [
      "Persist order configuration by organisation.",
      "Add draft PO lifecycle state machine.",
      "Audit submit, approve, reject, and amend events."
    ]
  },
  {
    id: "receiving-discrepancy",
    title: "Receiving & Discrepancy Rules",
    description: "Prepare receiving controls, discrepancy capture, file evidence, and stock-in rules.",
    owner: "Supervisor / Manager",
    status: "backend-deferred",
    environmentScope: "Only LIVE receiving may eventually increase LIVE on-hand stock.",
    settings: [
      {
        id: "partial-receiving",
        label: "Partial Receiving Allowed",
        plannedControl: "Disabled toggle control",
        currentState: "Prepared for controlled partial deliveries",
        phaseBoundary: "No receive-against-PO backend exists here."
      },
      {
        id: "discrepancy-evidence",
        label: "Discrepancy Evidence Required",
        plannedControl: "Disabled policy selector",
        currentState: "Prepared for file/photo evidence rules",
        phaseBoundary: "No upload, file sync, or discrepancy write action is enabled."
      },
      {
        id: "receiving-stock-impact",
        label: "Receiving Stock Impact",
        plannedControl: "Disabled rule selector",
        currentState: "Prepared for movement creation after approval",
        phaseBoundary: "No stock increment is active."
      }
    ],
    safetyRules: [
      "Receiving must not change stock until quantity validation exists.",
      "Discrepancy evidence upload requires backend storage and permission review.",
      "TRAINING receiving must never create LIVE movement records."
    ],
    backendContract: [
      "Read open purchase orders by environment.",
      "Validate received quantity against ordered quantity.",
      "Create stock movement only after authorised receiving commit."
    ]
  },
  {
    id: "wastage-store-use",
    title: "Wastage & Store Use Rules",
    description: "Prepare internal stock reduction controls for damaged, expired, lost, or consumed stock.",
    owner: "Supervisor / Inventory Admin",
    status: "disabled-control",
    environmentScope: "Practice wastage/store-use events must remain separate from LIVE stock reduction.",
    settings: [
      {
        id: "wastage-approval-threshold",
        label: "Wastage Approval Threshold",
        plannedControl: "Disabled threshold control",
        currentState: "Prepared for manager approval threshold",
        phaseBoundary: "No wastage event creation is active."
      },
      {
        id: "store-use-reasons",
        label: "Store Use Reason Codes",
        plannedControl: "Disabled list editor",
        currentState: "Prepared for reason-code governance",
        phaseBoundary: "No reason-code save action is enabled."
      },
      {
        id: "evidence-for-high-value-loss",
        label: "Evidence Required For High-Value Loss",
        plannedControl: "Disabled policy toggle",
        currentState: "Prepared for future evidence policy",
        phaseBoundary: "No file upload or stock decrement exists."
      }
    ],
    safetyRules: [
      "Stock reduction must remain disabled until movement posting is scoped.",
      "High-value wastage requires approval before backend mutation.",
      "Reason-code configuration must be audited before use."
    ],
    backendContract: [
      "Persist allowed reason codes per organisation.",
      "Route high-value events to approval queue.",
      "Post stock decrement only after authorised workflow completion."
    ]
  },
  {
    id: "replenishment-intelligence",
    title: "Reorder Review & Gap Scan Rules",
    description: "Prepare replenishment thresholds, coverage windows, and risk scan settings without AI/backend claims.",
    owner: "Manager / Inventory Admin",
    status: "backend-deferred",
    environmentScope: "TEST can validate recommendation logic later; LIVE recommendations must use LIVE movement history only.",
    settings: [
      {
        id: "default-coverage-days",
        label: "Default Coverage Days",
        plannedControl: "Disabled numeric control",
        currentState: "Prepared for threshold defaults",
        phaseBoundary: "No demand calculation or reorder engine is connected."
      },
      {
        id: "gap-scan-lookback",
        label: "Gap Scan Lookback Window",
        plannedControl: "Disabled selector",
        currentState: "Prepared for risk scan tuning",
        phaseBoundary: "No scan engine is active."
      },
      {
        id: "supplier-consolidation",
        label: "Supplier Consolidation Rule",
        plannedControl: "Disabled policy selector",
        currentState: "Prepared for draft PO grouping",
        phaseBoundary: "No draft PO generation is enabled."
      }
    ],
    safetyRules: [
      "Recommendation language must remain preparation-only until calculations exist.",
      "LIVE recommendations must never mix TRAINING or TEST movement history.",
      "AI forecasting remains secondary and cannot mask missing inventory functionality."
    ],
    backendContract: [
      "Read stock, thresholds, supplier mappings, and movement history.",
      "Calculate coverage without inflating demand from stock-in events.",
      "Generate draft recommendations without auto-submitting orders."
    ]
  },
  {
    id: "stocktake",
    title: "Stocktake Rules",
    description: "Prepare count session, variance approval, and adjustment posting controls.",
    owner: "Manager / Inventory Admin",
    status: "disabled-control",
    environmentScope: "TRAINING counts may teach staff, but cannot post LIVE adjustments.",
    settings: [
      {
        id: "variance-approval-required",
        label: "Variance Approval Required",
        plannedControl: "Disabled toggle control",
        currentState: "Prepared for approval before adjustment posting",
        phaseBoundary: "No stocktake session engine is enabled."
      },
      {
        id: "blind-count-mode",
        label: "Blind Count Mode",
        plannedControl: "Disabled toggle control",
        currentState: "Prepared for controlled count visibility",
        phaseBoundary: "No count entry forms are active."
      },
      {
        id: "adjustment-posting-mode",
        label: "Adjustment Posting Mode",
        plannedControl: "Disabled selector",
        currentState: "Prepared for post-approval stock adjustments",
        phaseBoundary: "No stocktake adjustments can be posted."
      }
    ],
    safetyRules: [
      "Variance posting must never bypass approval rules.",
      "Stocktake sessions must lock environment context before counts start.",
      "Adjustment postings require audit linkage to count evidence."
    ],
    backendContract: [
      "Create count sessions by environment and location.",
      "Track entered counts and variance calculations.",
      "Post approved adjustments to movement ledger."
    ]
  },
  {
    id: "training-mode",
    title: "Training Mode Rules",
    description: "Prepare practice data reset, scenario visibility, and safe staff learning controls.",
    owner: "Admin / Trainer",
    status: "shell-ready",
    environmentScope: "Training controls must clearly state they never affect LIVE stock.",
    settings: [
      {
        id: "training-reset-policy",
        label: "Training Reset Policy",
        plannedControl: "Disabled admin action",
        currentState: "Prepared for future controlled reset",
        phaseBoundary: "No reset action or training dataset mutation is enabled."
      },
      {
        id: "practice-scenarios",
        label: "Practice Scenarios",
        plannedControl: "Disabled scenario selector",
        currentState: "Prepared for receiving, stocktake, and item lookup practice",
        phaseBoundary: "No scenario runner is active."
      },
      {
        id: "training-audit-view",
        label: "Training Audit View",
        plannedControl: "Disabled audit panel",
        currentState: "Prepared for training activity visibility",
        phaseBoundary: "No training event stream is connected."
      }
    ],
    safetyRules: [
      "Training reset must never delete or mutate LIVE records.",
      "Training pages must stay visibly bannered as non-live.",
      "Staff practice must not create supplier orders or stock movements in LIVE."
    ],
    backendContract: [
      "Seed controlled training datasets per organisation.",
      "Reset TRAINING records without touching LIVE.",
      "Audit training scenario activity separately from LIVE operations."
    ]
  },
  {
    id: "reporting-export",
    title: "Reporting & Export Rules",
    description: "Prepare report visibility, export permissions, and environment-safe reporting settings.",
    owner: "Manager / Owner",
    status: "backend-deferred",
    environmentScope: "LIVE exports are operational; TRAINING and TEST exports must be clearly labelled.",
    settings: [
      {
        id: "export-permission",
        label: "Export Permission Required",
        plannedControl: "Disabled role selector",
        currentState: "Prepared for report/export access control",
        phaseBoundary: "No export action exists in Phase 1H."
      },
      {
        id: "report-environment-label",
        label: "Report Environment Label",
        plannedControl: "Disabled required toggle",
        currentState: "Required by governance",
        phaseBoundary: "No reports are generated here."
      },
      {
        id: "scheduled-reports",
        label: "Scheduled Reports",
        plannedControl: "Disabled roadmap control",
        currentState: "Roadmap only",
        phaseBoundary: "No scheduling or email delivery is connected."
      }
    ],
    safetyRules: [
      "Reports must not mix LIVE, TRAINING, and TEST data.",
      "Exports require permission and audit trails before activation.",
      "Scheduled delivery must wait until notification governance exists."
    ],
    backendContract: [
      "Read report datasets by organisation and environment.",
      "Apply role-based export restrictions.",
      "Audit report views, exports, and scheduled delivery changes."
    ]
  },
  {
    id: "device-scanner",
    title: "Device & Scanner Rules",
    description: "Prepare scanner, workstation, and inventory device expectations without claiming device automation is live.",
    owner: "Admin / Support",
    status: "disabled-control",
    environmentScope: "Device rules must respect the active environment selected by the user session.",
    settings: [
      {
        id: "scanner-mode",
        label: "Scanner Mode",
        plannedControl: "Disabled selector",
        currentState: "Prepared for keyboard wedge, handheld, and future app modes",
        phaseBoundary: "No scanner capture pipeline is connected."
      },
      {
        id: "device-assignment-required",
        label: "Device Assignment Required",
        plannedControl: "Disabled toggle control",
        currentState: "Prepared for trusted workstation governance",
        phaseBoundary: "No inventory-specific device enforcement is active."
      },
      {
        id: "offline-warning-policy",
        label: "Offline Warning Policy",
        plannedControl: "Disabled policy selector",
        currentState: "Prepared for later offline-first messaging",
        phaseBoundary: "No offline sync engine exists in the portal."
      }
    ],
    safetyRules: [
      "Scanner input must not create or update records without explicit workflow confirmation.",
      "Device assignment rules must not block recovery/admin support access prematurely.",
      "Offline-first claims must remain deferred until sync infrastructure is scoped."
    ],
    backendContract: [
      "Bind inventory workflows to trusted devices where required.",
      "Validate scanner input before workflow actions.",
      "Add offline-state indicators only after sync architecture exists."
    ]
  }
];

export function getInventoryAdminConfigurationStatusLabel(status: InventoryAdminConfigurationStatus) {
  if (status === "shell-ready") return "Shell Ready";
  if (status === "disabled-control") return "Controls Disabled";
  return "Backend Deferred";
}

export function getInventoryAdminConfigurationStatusClass(status: InventoryAdminConfigurationStatus) {
  if (status === "shell-ready") return "state-enabled";
  if (status === "disabled-control") return "state-early";
  return "state-muted";
}

export function getInventoryAdminConfigurationSummary() {
  return inventoryAdminConfigurationGroups.reduce(
    (summary, group) => {
      summary.groups += 1;
      summary.settings += group.settings.length;
      if (group.status === "shell-ready") summary.shellReady += 1;
      if (group.status === "disabled-control") summary.disabledControls += 1;
      if (group.status === "backend-deferred") summary.backendDeferred += 1;
      return summary;
    },
    {
      groups: 0,
      settings: 0,
      shellReady: 0,
      disabledControls: 0,
      backendDeferred: 0
    }
  );
}

export const inventoryAdminConfigurationBoundaries = [
  "Configuration shell only",
  "No save buttons",
  "No forms or file uploads",
  "No database writes",
  "No live stock mutation",
  "All future settings must be environment-scoped and audit-logged"
];
