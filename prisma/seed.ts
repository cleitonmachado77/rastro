import {
  EvidenceLevel,
  FactStatus,
  PrismaClient,
} from "@prisma/client";
import {
  buildBreakdown,
  computeRawScore,
  normalizeScores,
  type RelevanceInput,
} from "../src/lib/relevance";

const prisma = new PrismaClient();

function d(iso: string) {
  return new Date(iso);
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.editorialReview.deleteMany();
  await prisma.actorRelevanceScore.deleteMany();
  await prisma.relationshipSource.deleteMany();
  await prisma.eventSource.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.document.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.eventActor.deleteMany();
  await prisma.event.deleteMany();
  await prisma.caseActor.deleteMany();
  await prisma.actorRole.deleteMany();
  await prisma.actorAlias.deleteMany();
  await prisma.source.deleteMany();
  await prisma.location.deleteMany();
  await prisma.actor.deleteMany();
  await prisma.case.deleteMany();
  await prisma.user.deleteMany();

  const editor = await prisma.user.create({
    data: {
      email: "editor@rastro.local",
      name: "Editor Rastro",
      role: "admin",
    },
  });

  const caso = await prisma.case.create({
    data: {
      slug: "banco-aurora",
      name: "Caso Banco Aurora",
      description:
        "Caso fictício de desenvolvimento. Relata a trajetória da Empresa Aurora, sua relação com o Banco Aurora, contratos públicos, auditorias e desdobramentos judiciais. Nenhum fato abaixo é real.",
      startDate: d("2019-03-01"),
      currentSituation:
        "Em fase de julgamento fictício. Dados criados apenas para testar a plataforma.",
      status: "PUBLISHED",
      featured: true,
      createdById: editor.id,
      reviewedById: editor.id,
      reviewedAt: new Date(),
    },
  });

  const actorsData = [
    {
      slug: "empresario-a",
      name: "Empresário A",
      shortName: "Empresário A",
      actorKind: "person",
      primaryType: "empresario",
      description:
        "Controlador da Empresa Aurora. Presença no mapa indica participação em fatos documentados do caso, não responsabilidade.",
      roles: [
        { role: "Empresário", startDate: d("2015-01-01") },
        { role: "Sócio-administrador", startDate: d("2019-03-01") },
      ],
      aliases: ["Empresário Alpha"],
    },
    {
      slug: "empresa-aurora",
      name: "Empresa Aurora",
      shortName: "Empresa Aurora",
      actorKind: "organization",
      primaryType: "empresa",
      description: "Empresa fictícia contratada em licitação pública no caso de teste.",
      roles: [{ role: "Sociedade limitada", startDate: d("2019-03-01") }],
      aliases: ["Aurora Ltda."],
    },
    {
      slug: "banco-aurora",
      name: "Banco Aurora",
      shortName: "Banco Aurora",
      actorKind: "organization",
      primaryType: "banco",
      description: "Instituição financeira fictícia com relação societária e contratual no caso.",
      roles: [{ role: "Instituição financeira", startDate: d("2000-01-01") }],
      aliases: ["Banco Aurora S.A."],
    },
    {
      slug: "deputado-b",
      name: "Deputado B",
      shortName: "Deputado B",
      actorKind: "person",
      primaryType: "deputado",
      description:
        "Parlamentar fictício citado em reuniões e deliberações relacionadas ao contrato. Presença ≠ culpa.",
      roles: [
        { role: "Deputado federal", startDate: d("2019-02-01"), endDate: d("2023-01-31") },
        { role: "Deputado federal", startDate: d("2023-02-01") },
      ],
      aliases: ["Dep. B"],
    },
    {
      slug: "orgao-c",
      name: "Órgão C",
      shortName: "Órgão C",
      actorKind: "organization",
      primaryType: "orgao",
      description: "Órgão público fictício contratante e objeto de auditoria.",
      roles: [{ role: "Órgão da administração pública", startDate: d("1990-01-01") }],
      aliases: ["Órgão Público C"],
    },
    {
      slug: "ministerio-publico",
      name: "Ministério Público",
      shortName: "MP",
      actorKind: "organization",
      primaryType: "ministerio_publico",
      description: "Instituição fictícia no caso de teste, responsável por denúncia e acompanhamento.",
      roles: [{ role: "Ministério Público", startDate: d("1988-10-05") }],
      aliases: ["MP"],
    },
    {
      slug: "tribunal-d",
      name: "Tribunal D",
      shortName: "Tribunal D",
      actorKind: "organization",
      primaryType: "tribunal",
      description: "Tribunal fictício onde tramitam decisões do caso.",
      roles: [{ role: "Tribunal", startDate: d("1988-10-05") }],
      aliases: ["Tribunal de Justiça D"],
    },
    {
      slug: "juiz-e",
      name: "Juiz E",
      shortName: "Juiz E",
      actorKind: "person",
      primaryType: "juiz",
      description: "Magistrado fictício que proferiu decisão interlocutória no caso.",
      roles: [{ role: "Juiz", startDate: d("2012-06-01") }],
      aliases: ["Dr. E"],
    },
  ] as const;

  const actors: Record<string, string> = {};
  for (const a of actorsData) {
    const created = await prisma.actor.create({
      data: {
        slug: a.slug,
        name: a.name,
        shortName: a.shortName,
        actorKind: a.actorKind,
        primaryType: a.primaryType,
        description: a.description,
        status: "PUBLISHED",
        createdById: editor.id,
        roles: { create: a.roles.map((r) => ({ ...r })) },
        aliases: { create: a.aliases.map((alias) => ({ alias })) },
      },
    });
    actors[a.slug] = created.id;
    await prisma.caseActor.create({
      data: { caseId: caso.id, actorId: created.id },
    });
  }

  const locations = {
    brasilia: await prisma.location.create({
      data: {
        caseId: caso.id,
        label: "Brasília, DF",
        city: "Brasília",
        state: "DF",
        country: "Brasil",
        latitude: -15.78,
        longitude: -47.93,
      },
    }),
    sp: await prisma.location.create({
      data: {
        caseId: caso.id,
        label: "São Paulo, SP",
        city: "São Paulo",
        state: "SP",
        country: "Brasil",
        latitude: -23.55,
        longitude: -46.63,
      },
    }),
  };

  const sources = {
    diario: await prisma.source.create({
      data: {
        caseId: caso.id,
        title: "Registro societário — criação da Empresa Aurora (fictício)",
        url: "https://example.com/rastro/diario-oficial-aurora",
        outlet: "Diário Oficial (fictício)",
        sourceType: "documentary",
        publishedAt: d("2019-03-12"),
        accessedAt: d("2025-01-10"),
        excerpt: "Arquivados os atos constitutivos da Empresa Aurora Ltda.",
        evidenceLevel: EvidenceLevel.OFFICIAL_DOCUMENT,
        status: "PUBLISHED",
      },
    }),
    portal: await prisma.source.create({
      data: {
        caseId: caso.id,
        title: "Portal da Transparência — contrato Órgão C × Empresa Aurora",
        url: "https://example.com/rastro/contrato-orgao-c",
        outlet: "Portal da Transparência (fictício)",
        sourceType: "institutional",
        publishedAt: d("2021-08-20"),
        accessedAt: d("2025-01-10"),
        excerpt: "Contrato nº 042/2021 no valor fictício de R$ 12 milhões.",
        evidenceLevel: EvidenceLevel.INSTITUTIONAL,
        status: "PUBLISHED",
      },
    }),
    reportagem: await prisma.source.create({
      data: {
        caseId: caso.id,
        title: "Reportagem: auditoria aponta indícios em contrato Aurora",
        url: "https://example.com/rastro/reportagem-auditoria",
        outlet: "Agência Pública Fictícia",
        sourceType: "journalistic",
        publishedAt: d("2023-04-02"),
        accessedAt: d("2025-01-10"),
        author: "Redação",
        excerpt:
          "Auditoria do Órgão C recomenda apuração. Texto ilustrativo — não reproduz matéria protegida.",
        evidenceLevel: EvidenceLevel.JOURNALISTIC,
        status: "PUBLISHED",
      },
    }),
    denuncia: await prisma.source.create({
      data: {
        caseId: caso.id,
        title: "Peça acusatória fictícia — Ministério Público",
        url: "https://example.com/rastro/denuncia-mp",
        outlet: "Ministério Público (fictício)",
        sourceType: "documentary",
        publishedAt: d("2024-02-15"),
        accessedAt: d("2025-01-10"),
        excerpt: "Denúncia oferecida com base em relatório de auditoria (caso fictício).",
        evidenceLevel: EvidenceLevel.OFFICIAL_DOCUMENT,
        status: "PUBLISHED",
      },
    }),
    decisao: await prisma.source.create({
      data: {
        caseId: caso.id,
        title: "Decisão interlocutória — Tribunal D",
        url: "https://example.com/rastro/decisao-tribunal-d",
        outlet: "Tribunal D (fictício)",
        sourceType: "documentary",
        publishedAt: d("2024-09-10"),
        accessedAt: d("2025-01-10"),
        excerpt: "Recebida a denúncia. Decisão fictícia para fins de demonstração.",
        evidenceLevel: EvidenceLevel.PRIMARY_EVIDENCE,
        status: "PUBLISHED",
      },
    }),
    operacao: await prisma.source.create({
      data: {
        caseId: caso.id,
        title: "Nota institucional sobre Operação Lume (fictícia)",
        url: "https://example.com/rastro/operacao-lume",
        outlet: "Polícia Federal (fictício)",
        sourceType: "institutional",
        publishedAt: d("2024-06-18"),
        accessedAt: d("2025-01-10"),
        excerpt: "Cumpridos mandados de busca relacionados ao Contrato 042/2021.",
        evidenceLevel: EvidenceLevel.INSTITUTIONAL,
        status: "PUBLISHED",
      },
    }),
  };

  type EvSeed = {
    slug: string;
    title: string;
    description: string;
    eventType: string;
    factStatus: FactStatus;
    evidenceLevel: EvidenceLevel;
    startDate: Date;
    endDate?: Date;
    locationId?: string;
    locationLabel?: string;
    importance: number;
    actorSlugs: Array<{ slug: string; role: string }>;
    sourceKeys: (keyof typeof sources)[];
  };

  const eventsSeed: EvSeed[] = [
    {
      slug: "criacao-empresa",
      title: "Criação da Empresa Aurora",
      description: "Registro da Empresa Aurora Ltda. com o Empresário A como sócio-administrador.",
      eventType: "criacao_empresa",
      factStatus: FactStatus.DOCUMENTED_FACT,
      evidenceLevel: EvidenceLevel.OFFICIAL_DOCUMENT,
      startDate: d("2019-03-12"),
      locationId: locations.sp.id,
      locationLabel: "São Paulo, SP",
      importance: 1.2,
      actorSlugs: [
        { slug: "empresa-aurora", role: "empresa_criada" },
        { slug: "empresario-a", role: "socio_fundador" },
      ],
      sourceKeys: ["diario"],
    },
    {
      slug: "entrada-socio",
      title: "Entrada do Banco Aurora como sócio",
      description: "Alteração societária com participação do Banco Aurora na Empresa Aurora.",
      eventType: "mudanca_societaria",
      factStatus: FactStatus.DOCUMENTED_FACT,
      evidenceLevel: EvidenceLevel.OFFICIAL_DOCUMENT,
      startDate: d("2020-06-01"),
      locationLabel: "São Paulo, SP",
      importance: 1.4,
      actorSlugs: [
        { slug: "empresa-aurora", role: "sociedade" },
        { slug: "banco-aurora", role: "novo_socio" },
        { slug: "empresario-a", role: "socio_remanescente" },
      ],
      sourceKeys: ["diario"],
    },
    {
      slug: "contrato-publico",
      title: "Assinatura de contrato público",
      description:
        "Órgão C celebra Contrato 042/2021 com a Empresa Aurora, após licitação fictícia.",
      eventType: "contrato",
      factStatus: FactStatus.DOCUMENTED_FACT,
      evidenceLevel: EvidenceLevel.INSTITUTIONAL,
      startDate: d("2021-08-20"),
      locationId: locations.brasilia.id,
      locationLabel: "Brasília, DF",
      importance: 2,
      actorSlugs: [
        { slug: "orgao-c", role: "contratante" },
        { slug: "empresa-aurora", role: "contratada" },
        { slug: "deputado-b", role: "mencionado_em_reuniao" },
      ],
      sourceKeys: ["portal"],
    },
    {
      slug: "auditoria",
      title: "Auditoria interna no Órgão C",
      description:
        "Auditoria recomenda apuração de irregularidades formais no Contrato 042/2021. Trata-se de apuração, não de condenação.",
      eventType: "auditoria",
      factStatus: FactStatus.INVESTIGATION,
      evidenceLevel: EvidenceLevel.INSTITUTIONAL,
      startDate: d("2023-02-10"),
      endDate: d("2023-03-30"),
      locationLabel: "Brasília, DF",
      importance: 1.8,
      actorSlugs: [
        { slug: "orgao-c", role: "auditado" },
        { slug: "empresa-aurora", role: "objeto_auditoria" },
      ],
      sourceKeys: ["reportagem"],
    },
    {
      slug: "investigacao",
      title: "Abertura de investigação",
      description:
        "Com base no relatório de auditoria, inicia-se investigação. Status: investigação — não equivale a culpa.",
      eventType: "investigacao",
      factStatus: FactStatus.INVESTIGATION,
      evidenceLevel: EvidenceLevel.JOURNALISTIC,
      startDate: d("2023-05-01"),
      importance: 2.2,
      actorSlugs: [
        { slug: "ministerio-publico", role: "investigador" },
        { slug: "empresa-aurora", role: "investigada" },
        { slug: "empresario-a", role: "investigado" },
      ],
      sourceKeys: ["reportagem"],
    },
    {
      slug: "denuncia",
      title: "Denúncia oferecida pelo Ministério Público",
      description:
        "Denúncia formal (fictícia). Representa acusação formal, não condenação.",
      eventType: "denuncia",
      factStatus: FactStatus.DENUNCIATION,
      evidenceLevel: EvidenceLevel.OFFICIAL_DOCUMENT,
      startDate: d("2024-02-15"),
      importance: 2.5,
      actorSlugs: [
        { slug: "ministerio-publico", role: "denunciante" },
        { slug: "empresario-a", role: "denunciado" },
        { slug: "empresa-aurora", role: "denunciada" },
      ],
      sourceKeys: ["denuncia"],
    },
    {
      slug: "operacao-lume",
      title: "Operação Lume",
      description: "Cumprimento de mandados de busca e apreensão relacionados ao contrato.",
      eventType: "operacao",
      factStatus: FactStatus.INVESTIGATION,
      evidenceLevel: EvidenceLevel.INSTITUTIONAL,
      startDate: d("2024-06-18"),
      locationLabel: "São Paulo, SP",
      importance: 2.3,
      actorSlugs: [
        { slug: "empresa-aurora", role: "alvo" },
        { slug: "empresario-a", role: "alvo" },
        { slug: "banco-aurora", role: "local_relacionado" },
      ],
      sourceKeys: ["operacao"],
    },
    {
      slug: "decisao-interlocutoria",
      title: "Decisão interlocutória recebe denúncia",
      description: "Juiz E, no Tribunal D, recebe a denúncia. Decisão processual, não mérito condenatório.",
      eventType: "decisao_judicial",
      factStatus: FactStatus.DECISION,
      evidenceLevel: EvidenceLevel.PRIMARY_EVIDENCE,
      startDate: d("2024-09-10"),
      locationLabel: "Brasília, DF",
      importance: 2.4,
      actorSlugs: [
        { slug: "juiz-e", role: "julgador" },
        { slug: "tribunal-d", role: "foro" },
        { slug: "empresario-a", role: "parte" },
        { slug: "ministerio-publico", role: "parte" },
      ],
      sourceKeys: ["decisao"],
    },
    {
      slug: "julgamento",
      title: "Início do julgamento",
      description: "Tribunal D inicia fase de julgamento do caso fictício.",
      eventType: "julgamento",
      factStatus: FactStatus.PROCESS,
      evidenceLevel: EvidenceLevel.OFFICIAL_DOCUMENT,
      startDate: d("2025-03-01"),
      importance: 2.0,
      actorSlugs: [
        { slug: "tribunal-d", role: "foro" },
        { slug: "juiz-e", role: "relator" },
        { slug: "empresario-a", role: "parte" },
        { slug: "empresa-aurora", role: "parte" },
        { slug: "ministerio-publico", role: "parte" },
      ],
      sourceKeys: ["decisao"],
    },
  ];

  const eventIds: Record<string, string> = {};
  for (const e of eventsSeed) {
    const created = await prisma.event.create({
      data: {
        caseId: caso.id,
        slug: e.slug,
        title: e.title,
        description: e.description,
        eventType: e.eventType,
        factStatus: e.factStatus,
        evidenceLevel: e.evidenceLevel,
        startDate: e.startDate,
        endDate: e.endDate,
        locationId: e.locationId,
        locationLabel: e.locationLabel,
        importance: e.importance,
        status: "PUBLISHED",
        createdById: editor.id,
        eventActors: {
          create: e.actorSlugs.map((a) => ({
            actorId: actors[a.slug],
            role: a.role,
          })),
        },
        eventSources: {
          create: e.sourceKeys.map((k) => ({ sourceId: sources[k].id })),
        },
      },
    });
    eventIds[e.slug] = created.id;
  }

  type RelSeed = {
    from: string;
    to: string;
    relationType: string;
    description: string;
    weight: number;
    startDate: Date;
    endDate?: Date;
    factStatus: FactStatus;
    evidenceLevel: EvidenceLevel;
    eventSlug?: string;
    sourceKeys: (keyof typeof sources)[];
  };

  const rels: RelSeed[] = [
    {
      from: "empresario-a",
      to: "empresa-aurora",
      relationType: "sociedade",
      description: "Sócio-administrador da Empresa Aurora desde a constituição.",
      weight: 3,
      startDate: d("2019-03-12"),
      factStatus: FactStatus.DOCUMENTED_FACT,
      evidenceLevel: EvidenceLevel.OFFICIAL_DOCUMENT,
      eventSlug: "criacao-empresa",
      sourceKeys: ["diario"],
    },
    {
      from: "banco-aurora",
      to: "empresa-aurora",
      relationType: "sociedade",
      description: "Participação societária a partir de 2020.",
      weight: 2.5,
      startDate: d("2020-06-01"),
      factStatus: FactStatus.DOCUMENTED_FACT,
      evidenceLevel: EvidenceLevel.OFFICIAL_DOCUMENT,
      eventSlug: "entrada-socio",
      sourceKeys: ["diario"],
    },
    {
      from: "empresa-aurora",
      to: "orgao-c",
      relationType: "contrato",
      description: "Contrato público 042/2021.",
      weight: 3,
      startDate: d("2021-08-20"),
      endDate: d("2024-08-20"),
      factStatus: FactStatus.DOCUMENTED_FACT,
      evidenceLevel: EvidenceLevel.INSTITUTIONAL,
      eventSlug: "contrato-publico",
      sourceKeys: ["portal"],
    },
    {
      from: "deputado-b",
      to: "orgao-c",
      relationType: "reuniao",
      description: "Participação citada em reunião sobre o contrato (fonte jornalística).",
      weight: 1.2,
      startDate: d("2021-07-01"),
      factStatus: FactStatus.REPORTAGE,
      evidenceLevel: EvidenceLevel.JOURNALISTIC,
      eventSlug: "contrato-publico",
      sourceKeys: ["portal", "reportagem"],
    },
    {
      from: "orgao-c",
      to: "empresa-aurora",
      relationType: "fiscalizacao",
      description: "Auditoria e fiscalização do contrato.",
      weight: 2,
      startDate: d("2023-02-10"),
      factStatus: FactStatus.INVESTIGATION,
      evidenceLevel: EvidenceLevel.INSTITUTIONAL,
      eventSlug: "auditoria",
      sourceKeys: ["reportagem"],
    },
    {
      from: "ministerio-publico",
      to: "empresa-aurora",
      relationType: "investigacao",
      description: "Investigação e posterior denúncia. Não implica condenação.",
      weight: 2.8,
      startDate: d("2023-05-01"),
      factStatus: FactStatus.INVESTIGATION,
      evidenceLevel: EvidenceLevel.JOURNALISTIC,
      eventSlug: "investigacao",
      sourceKeys: ["reportagem", "denuncia"],
    },
    {
      from: "ministerio-publico",
      to: "empresario-a",
      relationType: "investigacao",
      description: "Investigação envolvendo o empresário A.",
      weight: 2.6,
      startDate: d("2023-05-01"),
      factStatus: FactStatus.DENUNCIATION,
      evidenceLevel: EvidenceLevel.OFFICIAL_DOCUMENT,
      eventSlug: "denuncia",
      sourceKeys: ["denuncia"],
    },
    {
      from: "juiz-e",
      to: "empresario-a",
      relationType: "decisao",
      description: "Decisão interlocutória no processo (recebimento da denúncia).",
      weight: 2.2,
      startDate: d("2024-09-10"),
      factStatus: FactStatus.DECISION,
      evidenceLevel: EvidenceLevel.PRIMARY_EVIDENCE,
      eventSlug: "decisao-interlocutoria",
      sourceKeys: ["decisao"],
    },
    {
      from: "juiz-e",
      to: "tribunal-d",
      relationType: "cargo",
      description: "Juiz lotado no Tribunal D.",
      weight: 1.5,
      startDate: d("2018-01-01"),
      factStatus: FactStatus.DOCUMENTED_FACT,
      evidenceLevel: EvidenceLevel.INSTITUTIONAL,
      sourceKeys: ["decisao"],
    },
    {
      from: "tribunal-d",
      to: "ministerio-publico",
      relationType: "relacao_institucional",
      description: "Tramitação institucional do processo.",
      weight: 1.4,
      startDate: d("2024-02-15"),
      factStatus: FactStatus.PROCESS,
      evidenceLevel: EvidenceLevel.OFFICIAL_DOCUMENT,
      eventSlug: "julgamento",
      sourceKeys: ["decisao"],
    },
  ];

  for (const r of rels) {
    const created = await prisma.relationship.create({
      data: {
        caseId: caso.id,
        fromActorId: actors[r.from],
        toActorId: actors[r.to],
        relationType: r.relationType,
        description: r.description,
        weight: r.weight,
        startDate: r.startDate,
        endDate: r.endDate,
        factStatus: r.factStatus,
        evidenceLevel: r.evidenceLevel,
        relatedEventId: r.eventSlug ? eventIds[r.eventSlug] : null,
        status: "PUBLISHED",
        createdById: editor.id,
        sources: {
          create: r.sourceKeys.map((k) => ({ sourceId: sources[k].id })),
        },
      },
    });
    void created;
  }

  await prisma.document.createMany({
    data: [
      {
        caseId: caso.id,
        actorId: actors["empresa-aurora"],
        eventId: eventIds["criacao-empresa"],
        title: "Contrato social — Empresa Aurora (fictício)",
        documentType: "registro_societario",
        url: "https://example.com/rastro/contrato-social",
        summary: "Metadados do documento fictício de constituição.",
        evidenceLevel: EvidenceLevel.OFFICIAL_DOCUMENT,
        publishedAt: d("2019-03-12"),
      },
      {
        caseId: caso.id,
        actorId: actors["orgao-c"],
        eventId: eventIds["contrato-publico"],
        title: "Contrato 042/2021 (fictício)",
        documentType: "contrato",
        url: "https://example.com/rastro/contrato-042",
        summary: "Resumo do contrato público fictício.",
        evidenceLevel: EvidenceLevel.PRIMARY_EVIDENCE,
        publishedAt: d("2021-08-20"),
      },
    ],
  });

  // Relevância
  const allActors = await prisma.actor.findMany({
    where: { caseActors: { some: { caseId: caso.id } } },
    include: {
      eventActors: { include: { event: true } },
      outgoing: true,
      incoming: true,
    },
  });

  const inputs: RelevanceInput[] = [];
  const actorOrder: string[] = [];

  for (const actor of allActors) {
    const caseEvents = actor.eventActors.filter((ea) => ea.event.caseId === caso.id);
    const relsForActor = [...actor.outgoing, ...actor.incoming].filter(
      (r) => r.caseId === caso.id
    );
    const sourceIds = new Set<string>();
    const outlets = new Set<string>();
    let official = 0;
    let decisions = 0;
    let recent = 0;
    let importance = 0;
    const cutoff = d("2023-01-01");

    for (const ea of caseEvents) {
      importance += ea.event.importance;
      if (
        ea.event.factStatus === "DECISION" ||
        ea.event.factStatus === "CONVICTION" ||
        ea.event.factStatus === "ACQUITTAL"
      ) {
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
          es.source.evidenceLevel === "OFFICIAL_DOCUMENT" ||
          es.source.evidenceLevel === "PRIMARY_EVIDENCE"
        ) {
          official += 1;
        }
      }
    }

    const connected = new Set(
      relsForActor.flatMap((r) => [r.fromActorId, r.toActorId])
    );
    connected.delete(actor.id);

    const input: RelevanceInput = {
      eventCount: caseEvents.length,
      relationshipCount: relsForActor.length,
      sourceCount: sourceIds.size,
      independentSourceOutlets: outlets.size,
      officialEvidenceCount: official,
      decisionCount: decisions,
      recentEventCount: recent,
      connectedActors: connected.size,
      totalImportance: importance,
    };
    inputs.push(input);
    actorOrder.push(actor.id);
  }

  const raws = inputs.map((i) => computeRawScore(i).raw);
  const norms = normalizeScores(raws);

  for (let i = 0; i < actorOrder.length; i++) {
    const { raw, components } = computeRawScore(inputs[i]);
    const breakdown = buildBreakdown(inputs[i], raw, components, norms[i]);
    await prisma.actorRelevanceScore.create({
      data: {
        actorId: actorOrder[i],
        caseId: caso.id,
        score: raw,
        normalizedScore: norms[i],
        breakdownJson: JSON.stringify(breakdown),
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      entityType: "Case",
      entityId: caso.id,
      action: "seed",
      afterJson: JSON.stringify({ slug: caso.slug, name: caso.name }),
      reason: "Carga inicial do caso fictício Banco Aurora",
      userId: editor.id,
    },
  });

  console.log("Seed OK: Caso Banco Aurora");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
