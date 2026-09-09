"use server";

import { revalidatePath } from "next/cache";
import {
  EvidenceLevel,
  FactStatus,
  EditorialStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recomputeCaseRelevance, writeAudit } from "@/lib/case-data";

async function getEditorId() {
  const user = await prisma.user.findFirst({ where: { role: "admin" } });
  return user?.id;
}

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}

export async function createCaseAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!name || !description) throw new Error("Nome e descrição são obrigatórios");

  const editorId = await getEditorId();
  const slugBase = slugify(name) || "caso";
  let slug = slugBase;
  let i = 1;
  while (await prisma.case.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${i++}`;
  }

  const created = await prisma.case.create({
    data: {
      name,
      slug,
      description,
      currentSituation: String(formData.get("currentSituation") || "") || null,
      status: EditorialStatus.PUBLISHED,
      featured: formData.get("featured") === "on",
      createdById: editorId,
      reviewedById: editorId,
      reviewedAt: new Date(),
    },
  });

  await writeAudit({
    entityType: "Case",
    entityId: created.id,
    action: "create",
    after: created,
    userId: editorId,
  });

  revalidatePath("/");
  revalidatePath("/casos");
  revalidatePath("/admin");
}

export async function createActorAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const caseId = String(formData.get("caseId") || "");
  const actorKind = String(formData.get("actorKind") || "person");
  const primaryType = String(formData.get("primaryType") || "outro");
  const description = String(formData.get("description") || "") || null;
  if (!name || !caseId) throw new Error("Nome e caso são obrigatórios");

  const editorId = await getEditorId();
  const slugBase = slugify(name) || "ator";
  let slug = slugBase;
  let i = 1;
  while (await prisma.actor.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${i++}`;
  }

  const actor = await prisma.actor.create({
    data: {
      name,
      slug,
      shortName: name,
      actorKind,
      primaryType,
      description,
      status: EditorialStatus.PUBLISHED,
      createdById: editorId,
      caseActors: { create: { caseId } },
    },
  });

  await recomputeCaseRelevance(caseId);
  await writeAudit({
    entityType: "Actor",
    entityId: actor.id,
    action: "create",
    after: actor,
    userId: editorId,
  });

  revalidatePath("/admin");
  revalidatePath("/casos");
}

export async function createEventAction(formData: FormData) {
  const caseId = String(formData.get("caseId") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const eventType = String(formData.get("eventType") || "outro");
  const factStatus = String(formData.get("factStatus") || "DOCUMENTED_FACT") as FactStatus;
  const evidenceLevel = String(
    formData.get("evidenceLevel") || "JOURNALISTIC"
  ) as EvidenceLevel;
  const startDate = String(formData.get("startDate") || "");
  const actorId = String(formData.get("actorId") || "");

  if (!caseId || !title || !description || !startDate) {
    throw new Error("Campos obrigatórios ausentes");
  }

  const editorId = await getEditorId();
  const slug = slugify(title) || `evento-${Date.now()}`;

  const event = await prisma.event.create({
    data: {
      caseId,
      slug: `${slug}-${Date.now().toString(36)}`,
      title,
      description,
      eventType,
      factStatus,
      evidenceLevel,
      startDate: new Date(startDate),
      status: EditorialStatus.PUBLISHED,
      createdById: editorId,
      eventActors: actorId
        ? { create: [{ actorId, role: "participante" }] }
        : undefined,
    },
  });

  await recomputeCaseRelevance(caseId);
  await writeAudit({
    entityType: "Event",
    entityId: event.id,
    action: "create",
    after: event,
    userId: editorId,
  });

  revalidatePath("/admin");
  revalidatePath(`/casos`);
}

export async function createRelationshipAction(formData: FormData) {
  const caseId = String(formData.get("caseId") || "");
  const fromActorId = String(formData.get("fromActorId") || "");
  const toActorId = String(formData.get("toActorId") || "");
  const relationType = String(formData.get("relationType") || "relacao");
  const description = String(formData.get("description") || "") || null;
  const weight = Number(formData.get("weight") || 1);
  const startDate = String(formData.get("startDate") || "") || null;
  const factStatus = String(formData.get("factStatus") || "DOCUMENTED_FACT") as FactStatus;
  const evidenceLevel = String(
    formData.get("evidenceLevel") || "JOURNALISTIC"
  ) as EvidenceLevel;

  if (!caseId || !fromActorId || !toActorId) {
    throw new Error("Caso e atores são obrigatórios");
  }

  const editorId = await getEditorId();
  const rel = await prisma.relationship.create({
    data: {
      caseId,
      fromActorId,
      toActorId,
      relationType,
      description,
      weight: Number.isFinite(weight) ? weight : 1,
      startDate: startDate ? new Date(startDate) : null,
      factStatus,
      evidenceLevel,
      status: EditorialStatus.PUBLISHED,
      createdById: editorId,
    },
  });

  await recomputeCaseRelevance(caseId);
  await writeAudit({
    entityType: "Relationship",
    entityId: rel.id,
    action: "create",
    after: rel,
    userId: editorId,
  });

  revalidatePath("/admin");
  revalidatePath("/casos");
}

export async function createSourceAction(formData: FormData) {
  const caseId = String(formData.get("caseId") || "") || null;
  const title = String(formData.get("title") || "").trim();
  const url = String(formData.get("url") || "") || null;
  const outlet = String(formData.get("outlet") || "") || null;
  const sourceType = String(formData.get("sourceType") || "journalistic");
  const excerpt = String(formData.get("excerpt") || "") || null;
  const evidenceLevel = String(
    formData.get("evidenceLevel") || "JOURNALISTIC"
  ) as EvidenceLevel;
  const eventId = String(formData.get("eventId") || "") || null;

  if (!title) throw new Error("Título obrigatório");

  const editorId = await getEditorId();
  const source = await prisma.source.create({
    data: {
      caseId,
      title,
      url,
      outlet,
      sourceType,
      excerpt,
      evidenceLevel,
      accessedAt: new Date(),
      status: EditorialStatus.PUBLISHED,
      createdById: editorId,
      eventSources: eventId ? { create: [{ eventId }] } : undefined,
    },
  });

  await writeAudit({
    entityType: "Source",
    entityId: source.id,
    action: "create",
    after: source,
    userId: editorId,
  });

  if (caseId) await recomputeCaseRelevance(caseId);

  revalidatePath("/admin");
}

export async function updateCaseSituationAction(formData: FormData) {
  const caseId = String(formData.get("caseId") || "");
  const currentSituation = String(formData.get("currentSituation") || "").trim();
  if (!caseId) throw new Error("Caso obrigatório");

  const before = await prisma.case.findUnique({ where: { id: caseId } });
  const updated = await prisma.case.update({
    where: { id: caseId },
    data: { currentSituation },
  });

  const editorId = await getEditorId();
  await writeAudit({
    entityType: "Case",
    entityId: caseId,
    action: "update",
    before,
    after: updated,
    reason: "Atualização de situação atual",
    userId: editorId,
  });

  revalidatePath("/admin");
  revalidatePath(`/casos/${updated.slug}`);
}
