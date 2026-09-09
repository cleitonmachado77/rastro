import { notFound } from "next/navigation";
import { getCaseBySlug } from "@/lib/queries";
import { CaseExplorer } from "@/components/graph/CaseExplorer";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function CasoPage({ params }: Props) {
  const { slug } = await params;
  const caso = await getCaseBySlug(slug);
  if (!caso) notFound();

  const actors = caso.caseActors.map((ca) => {
    const relevance = ca.actor.relevance.find((r) => r.caseId === caso.id);
    return {
      id: ca.actor.id,
      slug: ca.actor.slug,
      name: ca.actor.name,
      shortName: ca.actor.shortName,
      actorKind: ca.actor.actorKind,
      primaryType: ca.actor.primaryType,
      description: ca.actor.description,
      roles: ca.actor.roles.map((r) => ({
        role: r.role,
        startDate: r.startDate?.toISOString() ?? null,
        endDate: r.endDate?.toISOString() ?? null,
      })),
      aliases: ca.actor.aliases.map((a) => a.alias),
      documents: ca.actor.documents.map((d) => ({
        id: d.id,
        title: d.title,
        url: d.url,
        documentType: d.documentType,
      })),
      normalizedScore: relevance?.normalizedScore ?? 20,
      score: relevance?.score ?? 0,
      breakdownJson: relevance?.breakdownJson ?? "{}",
    };
  });

  const events = caso.events.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    description: e.description,
    eventType: e.eventType,
    factStatus: e.factStatus,
    evidenceLevel: e.evidenceLevel,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate?.toISOString() ?? null,
    locationLabel: e.locationLabel,
    importance: e.importance,
    actorIds: e.eventActors.map((ea) => ea.actorId),
    actorRoles: e.eventActors.map((ea) => ({
      actorId: ea.actorId,
      role: ea.role,
      name: ea.actor.name,
    })),
    sources: e.eventSources.map((es) => ({
      id: es.source.id,
      title: es.source.title,
      url: es.source.url,
      outlet: es.source.outlet,
      evidenceLevel: es.source.evidenceLevel,
      excerpt: es.source.excerpt,
    })),
  }));

  const relationships = caso.relationships.map((r) => ({
    id: r.id,
    fromActorId: r.fromActorId,
    toActorId: r.toActorId,
    fromName: r.fromActor.name,
    toName: r.toActor.name,
    relationType: r.relationType,
    description: r.description,
    weight: r.weight,
    startDate: r.startDate?.toISOString() ?? null,
    endDate: r.endDate?.toISOString() ?? null,
    factStatus: r.factStatus,
    evidenceLevel: r.evidenceLevel,
    relatedEventId: r.relatedEventId,
    sources: r.sources.map((rs) => ({
      id: rs.source.id,
      title: rs.source.title,
      url: rs.source.url,
      outlet: rs.source.outlet,
      evidenceLevel: rs.source.evidenceLevel,
      excerpt: rs.source.excerpt,
    })),
  }));

  return (
    <CaseExplorer
      caseMeta={{
        id: caso.id,
        slug: caso.slug,
        name: caso.name,
        description: caso.description,
        currentSituation: caso.currentSituation,
        counts: caso._count,
      }}
      actors={actors}
      events={events}
      relationships={relationships}
    />
  );
}
