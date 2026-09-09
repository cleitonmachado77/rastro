import { prisma } from "./prisma";
import {
  buildBreakdown,
  computeRawScore,
  normalizeScores,
  type RelevanceInput,
} from "./relevance";

export async function recomputeCaseRelevance(caseId: string) {
  const actors = await prisma.actor.findMany({
    where: { caseActors: { some: { caseId } } },
    include: {
      eventActors: { include: { event: true } },
      outgoing: true,
      incoming: true,
    },
  });

  const inputs: RelevanceInput[] = [];
  const ids: string[] = [];
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 2);

  for (const actor of actors) {
    const caseEvents = actor.eventActors.filter((ea) => ea.event.caseId === caseId);
    const rels = [...actor.outgoing, ...actor.incoming].filter((r) => r.caseId === caseId);
    const sourceIds = new Set<string>();
    const outlets = new Set<string>();
    let official = 0;
    let decisions = 0;
    let recent = 0;
    let importance = 0;

    for (const ea of caseEvents) {
      importance += ea.event.importance;
      if (["DECISION", "CONVICTION", "ACQUITTAL"].includes(ea.event.factStatus)) {
        decisions += 1;
      }
      if (ea.event.startDate >= cutoff) recent += 1;
      const evSources = await prisma.eventSource.findMany({
        where: { eventId: ea.eventId },
        include: { source: true },
      });
      for (const es of evSources) {
        sourceIds.add(es.sourceId);
        if (es.source.outlet) outlets.add(es.source.outlet);
        if (
          ["OFFICIAL_DOCUMENT", "PRIMARY_EVIDENCE"].includes(es.source.evidenceLevel)
        ) {
          official += 1;
        }
      }
    }

    const connected = new Set(rels.flatMap((r) => [r.fromActorId, r.toActorId]));
    connected.delete(actor.id);

    inputs.push({
      eventCount: caseEvents.length,
      relationshipCount: rels.length,
      sourceCount: sourceIds.size,
      independentSourceOutlets: outlets.size,
      officialEvidenceCount: official,
      decisionCount: decisions,
      recentEventCount: recent,
      connectedActors: connected.size,
      totalImportance: importance,
    });
    ids.push(actor.id);
  }

  const raws = inputs.map((i) => computeRawScore(i).raw);
  const norms = normalizeScores(raws);

  for (let i = 0; i < ids.length; i++) {
    const { raw, components } = computeRawScore(inputs[i]);
    const breakdown = buildBreakdown(inputs[i], raw, components, norms[i]);
    await prisma.actorRelevanceScore.upsert({
      where: { actorId_caseId: { actorId: ids[i], caseId } },
      create: {
        actorId: ids[i],
        caseId,
        score: raw,
        normalizedScore: norms[i],
        breakdownJson: JSON.stringify(breakdown),
      },
      update: {
        score: raw,
        normalizedScore: norms[i],
        breakdownJson: JSON.stringify(breakdown),
        computedAt: new Date(),
      },
    });
  }
}

export async function writeAudit(params: {
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  userId?: string;
}) {
  await prisma.auditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      beforeJson: params.before ? JSON.stringify(params.before) : null,
      afterJson: params.after ? JSON.stringify(params.after) : null,
      reason: params.reason,
      userId: params.userId,
    },
  });
}
