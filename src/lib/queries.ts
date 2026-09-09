import { prisma } from "./prisma";

export async function getFeaturedCases() {
  return prisma.case.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    include: {
      _count: {
        select: {
          caseActors: true,
          events: true,
          sources: true,
          relationships: true,
        },
      },
    },
  });
}

export async function getCaseBySlug(slug: string) {
  return prisma.case.findUnique({
    where: { slug },
    include: {
      caseActors: {
        include: {
          actor: {
            include: {
              roles: { orderBy: { startDate: "asc" } },
              aliases: true,
              relevance: true,
              documents: true,
            },
          },
        },
      },
      events: {
        where: { status: "PUBLISHED" },
        orderBy: { startDate: "asc" },
        include: {
          eventActors: { include: { actor: true } },
          eventSources: { include: { source: true } },
          documents: true,
        },
      },
      relationships: {
        where: { status: "PUBLISHED" },
        include: {
          fromActor: true,
          toActor: true,
          sources: { include: { source: true } },
          relatedEvent: true,
        },
      },
      sources: { where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" } },
      documents: true,
      _count: {
        select: {
          caseActors: true,
          events: true,
          sources: true,
          relationships: true,
        },
      },
    },
  });
}

export async function searchAll(query: string) {
  const q = query.trim();
  if (!q) {
    return { actors: [], events: [], cases: [], sources: [] };
  }

  const [actors, events, cases, sources] = await Promise.all([
    prisma.actor.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { shortName: { contains: q } },
          { aliases: { some: { alias: { contains: q } } } },
          { primaryType: { contains: q } },
        ],
      },
      take: 20,
      include: {
        caseActors: { include: { case: true } },
        aliases: true,
      },
    }),
    prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { eventType: { contains: q } },
        ],
      },
      take: 20,
      include: { case: true },
    }),
    prisma.case.findMany({
      where: {
        OR: [{ name: { contains: q } }, { description: { contains: q } }],
      },
      take: 10,
    }),
    prisma.source.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { outlet: { contains: q } },
          { excerpt: { contains: q } },
        ],
      },
      take: 10,
    }),
  ]);

  return { actors, events, cases, sources };
}
