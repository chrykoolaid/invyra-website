import { EnvironmentName, InventoryItemStatus } from "@prisma/client";
import type { CurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";

export type Sprint1Session = NonNullable<CurrentSession>;

export function scopeFromSession(session: Sprint1Session) {
  return { organisationId: session.organisation.id, environmentName: session.environment as EnvironmentName };
}

export function ensureSprint1WriteRole(session: Sprint1Session, mode: "write" | "admin" = "write") {
  const role = session.membership.role.name;
  if (mode === "admin") return role === "ADMINISTRATOR" || role === "OWNER";
  return role === "MANAGER" || role === "ADMINISTRATOR" || role === "OWNER";
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function requireString(value: unknown, label: string): string {
  const cleaned = cleanString(value);
  if (!cleaned) throw new Error(`${label} is required`);
  return cleaned;
}

export async function createInventoryItemMaster(params: { request: Request; session: Sprint1Session; body: unknown }) {
  const body = params.body as Record<string, unknown>;
  const scope = scopeFromSession(params.session);
  const sku = requireString(body.sku, "SKU");
  const name = requireString(body.name, "Name");
  const unitOfMeasure = requireString(body.unitOfMeasure ?? body.unit, "Unit");
  const barcode = cleanString(body.barcode);

  const duplicateSku = await prisma.inventoryItem.findUnique({ where: { organisationId_environmentName_sku: { ...scope, sku } } });
  if (duplicateSku) throw new Error("SKU already exists in this environment");

  if (barcode) {
    const duplicateBarcode = await prisma.inventoryItem.findFirst({ where: { ...scope, barcode } });
    if (duplicateBarcode) throw new Error("Barcode already exists in this environment");
  }

  const item = await prisma.inventoryItem.create({
    data: {
      ...scope,
      sku,
      barcode,
      name,
      description: cleanString(body.description),
      category: cleanString(body.category),
      brand: cleanString(body.brand),
      unitOfMeasure,
      createdByUserId: params.session.user.id,
      updatedByUserId: params.session.user.id
    }
  });

  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "ITEM_CREATED", targetType: "InventoryItem", targetId: item.id, metadata: { sku, name } });
  return item;
}

export async function updateInventoryItemMaster(params: { request: Request; session: Sprint1Session; id: string; body: unknown }) {
  const body = params.body as Record<string, unknown>;
  const scope = scopeFromSession(params.session);
  const existing = await prisma.inventoryItem.findFirst({ where: { ...scope, id: params.id } });
  if (!existing) throw new Error("Item not found in this environment");

  const sku = cleanString(body.sku) ?? existing.sku;
  const name = cleanString(body.name) ?? existing.name;
  const unitOfMeasure = cleanString(body.unitOfMeasure ?? body.unit) ?? existing.unitOfMeasure;
  const barcode = typeof body.barcode === "string" ? cleanString(body.barcode) : existing.barcode;

  if (sku !== existing.sku) {
    const duplicateSku = await prisma.inventoryItem.findUnique({ where: { organisationId_environmentName_sku: { ...scope, sku } } });
    if (duplicateSku && duplicateSku.id !== existing.id) throw new Error("SKU already exists in this environment");
  }
  if (barcode && barcode !== existing.barcode) {
    const duplicateBarcode = await prisma.inventoryItem.findFirst({ where: { ...scope, barcode, id: { not: existing.id } } });
    if (duplicateBarcode) throw new Error("Barcode already exists in this environment");
  }

  const item = await prisma.inventoryItem.update({
    where: { id: existing.id },
    data: {
      sku,
      barcode,
      name,
      description: typeof body.description === "string" ? cleanString(body.description) : existing.description,
      category: typeof body.category === "string" ? cleanString(body.category) : existing.category,
      brand: typeof body.brand === "string" ? cleanString(body.brand) : existing.brand,
      unitOfMeasure,
      updatedByUserId: params.session.user.id
    }
  });

  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "ITEM_UPDATED", targetType: "InventoryItem", targetId: item.id, metadata: { skuBefore: existing.sku, skuAfter: item.sku, nameBefore: existing.name, nameAfter: item.name } });
  return item;
}

export async function setInventoryItemArchived(params: { request: Request; session: Sprint1Session; id: string; archived: boolean }) {
  const scope = scopeFromSession(params.session);
  const existing = await prisma.inventoryItem.findFirst({ where: { ...scope, id: params.id } });
  if (!existing) throw new Error("Item not found in this environment");
  const item = await prisma.inventoryItem.update({ where: { id: existing.id }, data: { status: params.archived ? InventoryItemStatus.ARCHIVED : InventoryItemStatus.ACTIVE, archivedAt: params.archived ? new Date() : null, archivedByUserId: params.archived ? params.session.user.id : null, updatedByUserId: params.session.user.id } });
  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: params.archived ? "ITEM_ARCHIVED" : "ITEM_RESTORED", targetType: "InventoryItem", targetId: item.id, metadata: { sku: item.sku, name: item.name } });
  return item;
}

export async function createInventorySupplierMaster(params: { request: Request; session: Sprint1Session; body: unknown }) {
  const body = params.body as Record<string, unknown>;
  const scope = scopeFromSession(params.session);
  const name = requireString(body.name, "Supplier name");
  const supplierCode = cleanString(body.supplierCode) ?? `SUP-${Date.now().toString(36).toUpperCase()}`;

  const duplicate = await prisma.inventorySupplier.findUnique({ where: { organisationId_environmentName_supplierCode: { ...scope, supplierCode } } });
  if (duplicate) throw new Error("Supplier code already exists in this environment");

  const supplier = await prisma.inventorySupplier.create({ data: { ...scope, supplierCode, name, contactName: cleanString(body.contactName ?? body.contact), phone: cleanString(body.phone), email: cleanString(body.email), address: cleanString(body.address), notes: cleanString(body.notes), createdByUserId: params.session.user.id, updatedByUserId: params.session.user.id } });
  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "SUPPLIER_CREATED", targetType: "InventorySupplier", targetId: supplier.id, metadata: { supplierCode, name } });
  return supplier;
}

export async function updateInventorySupplierMaster(params: { request: Request; session: Sprint1Session; id: string; body: unknown }) {
  const body = params.body as Record<string, unknown>;
  const scope = scopeFromSession(params.session);
  const existing = await prisma.inventorySupplier.findFirst({ where: { ...scope, id: params.id } });
  if (!existing) throw new Error("Supplier not found in this environment");
  const supplierCode = cleanString(body.supplierCode) ?? existing.supplierCode;
  if (supplierCode !== existing.supplierCode) {
    const duplicate = await prisma.inventorySupplier.findUnique({ where: { organisationId_environmentName_supplierCode: { ...scope, supplierCode } } });
    if (duplicate && duplicate.id !== existing.id) throw new Error("Supplier code already exists in this environment");
  }
  const supplier = await prisma.inventorySupplier.update({ where: { id: existing.id }, data: { supplierCode, name: cleanString(body.name) ?? existing.name, contactName: typeof (body.contactName ?? body.contact) === "string" ? cleanString(body.contactName ?? body.contact) : existing.contactName, phone: typeof body.phone === "string" ? cleanString(body.phone) : existing.phone, email: typeof body.email === "string" ? cleanString(body.email) : existing.email, address: typeof body.address === "string" ? cleanString(body.address) : existing.address, notes: typeof body.notes === "string" ? cleanString(body.notes) : existing.notes, updatedByUserId: params.session.user.id } });
  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "SUPPLIER_UPDATED", targetType: "InventorySupplier", targetId: supplier.id, metadata: { codeBefore: existing.supplierCode, codeAfter: supplier.supplierCode, nameBefore: existing.name, nameAfter: supplier.name } });
  return supplier;
}

export async function setInventorySupplierArchived(params: { request: Request; session: Sprint1Session; id: string; archived: boolean }) {
  const scope = scopeFromSession(params.session);
  const existing = await prisma.inventorySupplier.findFirst({ where: { ...scope, id: params.id } });
  if (!existing) throw new Error("Supplier not found in this environment");
  const supplier = await prisma.inventorySupplier.update({ where: { id: existing.id }, data: { status: params.archived ? InventoryItemStatus.ARCHIVED : InventoryItemStatus.ACTIVE, archivedAt: params.archived ? new Date() : null, archivedByUserId: params.archived ? params.session.user.id : null, updatedByUserId: params.session.user.id } });
  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: params.archived ? "SUPPLIER_ARCHIVED" : "SUPPLIER_RESTORED", targetType: "InventorySupplier", targetId: supplier.id, metadata: { supplierCode: supplier.supplierCode, name: supplier.name } });
  return supplier;
}
