import { EnvironmentName, InventoryConfigurationStatus, InventoryMovementType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const organisationId = process.env.INVYRA_DEMO_ORGANISATION_ID ?? "invyra_demo_organisation";
const demoUserId = process.env.INVYRA_DEMO_CREATED_BY_USER_ID ?? null;

const environments: EnvironmentName[] = [EnvironmentName.LIVE, EnvironmentName.TRAINING, EnvironmentName.TEST];

const locations = [
  { id: "inventory_demo_location_backroom", code: "BACKROOM", name: "Backroom Storage" },
  { id: "inventory_demo_location_salesfloor", code: "SALES", name: "Sales Floor" }
];

const items = [
  {
    id: "inventory_demo_item_laundry_bags",
    sku: "INV-DEMO-LAUNDRY-BAGS",
    barcode: "930000000001",
    name: "Laundry Bags",
    description: "Read-only demo consumable for portal validation.",
    unitOfMeasure: "pack"
  },
  {
    id: "inventory_demo_item_detergent",
    sku: "INV-DEMO-DETERGENT",
    barcode: "930000000002",
    name: "Laundry Detergent",
    description: "Read-only demo stock item for portal validation.",
    unitOfMeasure: "bottle"
  },
  {
    id: "inventory_demo_item_hangers",
    sku: "INV-DEMO-HANGERS",
    barcode: "930000000003",
    name: "Hangers",
    description: "Read-only demo store-use item for portal validation.",
    unitOfMeasure: "bundle"
  }
];

const suppliers = [
  {
    id: "inventory_demo_supplier_cleanpro",
    supplierCode: "SUP-DEMO-CLEANPRO",
    name: "CleanPro Supplies",
    contactName: "Demo Supplier Contact",
    phone: "+63 000 000 0001",
    email: "cleanpro.demo@invyra.local"
  },
  {
    id: "inventory_demo_supplier_packline",
    supplierCode: "SUP-DEMO-PACKLINE",
    name: "Packline Wholesale",
    contactName: "Demo Purchasing Desk",
    phone: "+63 000 000 0002",
    email: "packline.demo@invyra.local"
  }
];

function scopedId(baseId: string, environment: EnvironmentName): string {
  return `${baseId}_${environment.toLowerCase()}`;
}

function scopedSku(baseSku: string, environment: EnvironmentName): string {
  return `${baseSku}-${environment}`;
}

async function seedEnvironment(environmentName: EnvironmentName) {
  for (const location of locations) {
    await prisma.inventoryLocation.upsert({
      where: {
        organisationId_environmentName_code: {
          organisationId,
          environmentName,
          code: location.code
        }
      },
      update: {
        name: location.name,
        updatedByUserId: demoUserId
      },
      create: {
        id: scopedId(location.id, environmentName),
        organisationId,
        environmentName,
        code: location.code,
        name: location.name,
        createdByUserId: demoUserId,
        updatedByUserId: demoUserId
      }
    });
  }

  for (const item of items) {
    await prisma.inventoryItem.upsert({
      where: {
        organisationId_environmentName_sku: {
          organisationId,
          environmentName,
          sku: scopedSku(item.sku, environmentName)
        }
      },
      update: {
        barcode: `${item.barcode}${environmentName === EnvironmentName.LIVE ? "0" : environmentName === EnvironmentName.TRAINING ? "1" : "2"}`,
        name: item.name,
        description: item.description,
        unitOfMeasure: item.unitOfMeasure,
        updatedByUserId: demoUserId
      },
      create: {
        id: scopedId(item.id, environmentName),
        organisationId,
        environmentName,
        sku: scopedSku(item.sku, environmentName),
        barcode: `${item.barcode}${environmentName === EnvironmentName.LIVE ? "0" : environmentName === EnvironmentName.TRAINING ? "1" : "2"}`,
        name: item.name,
        description: item.description,
        unitOfMeasure: item.unitOfMeasure,
        createdByUserId: demoUserId,
        updatedByUserId: demoUserId
      }
    });
  }

  for (const supplier of suppliers) {
    await prisma.inventorySupplier.upsert({
      where: {
        organisationId_environmentName_supplierCode: {
          organisationId,
          environmentName,
          supplierCode: supplier.supplierCode
        }
      },
      update: {
        name: supplier.name,
        contactName: supplier.contactName,
        phone: supplier.phone,
        email: supplier.email,
        updatedByUserId: demoUserId
      },
      create: {
        id: scopedId(supplier.id, environmentName),
        organisationId,
        environmentName,
        supplierCode: supplier.supplierCode,
        name: supplier.name,
        contactName: supplier.contactName,
        phone: supplier.phone,
        email: supplier.email,
        createdByUserId: demoUserId,
        updatedByUserId: demoUserId
      }
    });
  }

  const backroomId = scopedId("inventory_demo_location_backroom", environmentName);
  const salesId = scopedId("inventory_demo_location_salesfloor", environmentName);
  const itemIds = items.map((item) => scopedId(item.id, environmentName));
  const balanceRows = [
    { id: "inventory_demo_balance_laundry_backroom", locationId: backroomId, itemId: itemIds[0], quantityOnHand: "42" },
    { id: "inventory_demo_balance_detergent_backroom", locationId: backroomId, itemId: itemIds[1], quantityOnHand: "18" },
    { id: "inventory_demo_balance_hangers_sales", locationId: salesId, itemId: itemIds[2], quantityOnHand: "75" }
  ];

  for (const balance of balanceRows) {
    await prisma.inventoryStockBalance.upsert({
      where: {
        organisationId_environmentName_locationId_itemId: {
          organisationId,
          environmentName,
          locationId: balance.locationId,
          itemId: balance.itemId
        }
      },
      update: {
        quantityOnHand: balance.quantityOnHand
      },
      create: {
        id: scopedId(balance.id, environmentName),
        organisationId,
        environmentName,
        locationId: balance.locationId,
        itemId: balance.itemId,
        quantityOnHand: balance.quantityOnHand
      }
    });
  }

  const movementRows = [
    {
      id: "inventory_demo_movement_opening_laundry",
      locationId: backroomId,
      itemId: itemIds[0],
      movementType: InventoryMovementType.OPENING_BALANCE,
      quantityDelta: "42",
      quantityAfter: "42",
      referenceType: "DEMO_SEED",
      referenceId: "PHASE2I",
      reason: "Read-only demo opening balance."
    },
    {
      id: "inventory_demo_movement_opening_detergent",
      locationId: backroomId,
      itemId: itemIds[1],
      movementType: InventoryMovementType.OPENING_BALANCE,
      quantityDelta: "18",
      quantityAfter: "18",
      referenceType: "DEMO_SEED",
      referenceId: "PHASE2I",
      reason: "Read-only demo opening balance."
    },
    {
      id: "inventory_demo_movement_store_use_hangers",
      locationId: salesId,
      itemId: itemIds[2],
      movementType: InventoryMovementType.STORE_USE,
      quantityDelta: "-5",
      quantityAfter: "75",
      referenceType: "DEMO_SEED",
      referenceId: "PHASE2I",
      reason: "Read-only demo store-use example."
    }
  ];

  for (const movement of movementRows) {
    await prisma.inventoryMovement.upsert({
      where: { id: scopedId(movement.id, environmentName) },
      update: {
        locationId: movement.locationId,
        itemId: movement.itemId,
        movementType: movement.movementType,
        quantityDelta: movement.quantityDelta,
        quantityAfter: movement.quantityAfter,
        referenceType: movement.referenceType,
        referenceId: movement.referenceId,
        reason: movement.reason,
        createdByUserId: demoUserId
      },
      create: {
        id: scopedId(movement.id, environmentName),
        organisationId,
        environmentName,
        locationId: movement.locationId,
        itemId: movement.itemId,
        movementType: movement.movementType,
        quantityDelta: movement.quantityDelta,
        quantityAfter: movement.quantityAfter,
        referenceType: movement.referenceType,
        referenceId: movement.referenceId,
        reason: movement.reason,
        createdByUserId: demoUserId
      }
    });
  }

  await prisma.inventoryConfiguration.upsert({
    where: {
      organisationId_environmentName_key: {
        organisationId,
        environmentName,
        key: "demo.readOnlyPortalValidation"
      }
    },
    update: {
      valueJson: {
        phase: "2I",
        purpose: "Read-only portal validation demo data",
        writesEnabled: false,
        stockMutationEnabled: false
      },
      status: InventoryConfigurationStatus.ACTIVE,
      updatedByUserId: demoUserId
    },
    create: {
      id: scopedId("inventory_demo_configuration_readonly", environmentName),
      organisationId,
      environmentName,
      key: "demo.readOnlyPortalValidation",
      valueJson: {
        phase: "2I",
        purpose: "Read-only portal validation demo data",
        writesEnabled: false,
        stockMutationEnabled: false
      },
      status: InventoryConfigurationStatus.ACTIVE,
      createdByUserId: demoUserId,
      updatedByUserId: demoUserId
    }
  });
}

async function main() {
  const organisation = await prisma.organisation.findUnique({ where: { id: organisationId }, select: { id: true, name: true } });
  if (!organisation) {
    throw new Error(`Organisation ${organisationId} was not found. Run npm run db:seed first.`);
  }

  for (const environment of environments) {
    await seedEnvironment(environment);
  }

  console.log(`Inventory read-only demo seed completed for ${organisation.name} (${organisation.id}).`);
  console.log("Seeded environments: LIVE, TRAINING, TEST.");
  console.log("Boundary: demo seed adds read-only validation rows only; portal writes, uploads, imports, and stock mutation remain disabled.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
