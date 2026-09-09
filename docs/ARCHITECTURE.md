# RASTRO — Arquitetura do MVP

## 1. Visão

RASTRO transforma informações públicas dispersas em um grafo navegável de **atores**, **eventos**, **relações** e **fontes**, com **timeline** e **índice de relevância** transparente.

Princípio: presença no mapa = relação com fatos representados, **não** culpa.

## 2. Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│  Next.js App Router (React + TypeScript)                │
│  Páginas públicas + Admin + Server Actions / API        │
├─────────────────────────────────────────────────────────┤
│  Domínio                                                │
│  Case · Actor · Event · Relationship · Source · Evidence│
│  Relevance Engine · Audit Log                           │
├─────────────────────────────────────────────────────────┤
│  Prisma ORM → SQLite (MVP) / PostgreSQL (produção)      │
└─────────────────────────────────────────────────────────┘
```

- **Frontend:** Next.js, React Flow (`@xyflow/react`), Tailwind CSS
- **Backend:** Server Components + Server Actions
- **DB:** SQLite local no MVP (migração trivial para Postgres)
- **Auth:** usuário editorial seedado; Auth completa (Supabase) em fase posterior

## 3. Modelo de dados (núcleo)

| Entidade | Papel |
|----------|--------|
| `Case` | Contêiner editorial de um caso |
| `Actor` | Pessoa, organização ou objeto |
| `Event` | Acontecimento datado com `FactStatus` + `EvidenceLevel` |
| `Relationship` | Aresta semântica temporal entre atores |
| `Source` | Metadados + trecho curto + URL (sem cópia integral) |
| `ActorRelevanceScore` | Score calculado + breakdown JSON |
| `AuditLog` | Histórico de alterações |

## 4. Fluxo do usuário

```
Home → Explorar / Buscar → Caso → Grafo + Timeline
  → Seleciona ator → Painel lateral (timeline, fontes, “por que é grande?”)
  → Seleciona relação → Evidência + fontes
  → Filtra período/tipo/status → Mapa atualiza
```

## 5. Componentes de interface

- `SiteHeader` — marca + busca + nav
- `CaseGraph` — React Flow (nós tipados, zoom/pan/drag)
- `CaseTimeline` — eixo temporal com play/scrub
- `ActorPanel` / `RelationPanel` — painel lateral (drawer inferior no mobile)
- `CaseFilters` — tipo, status, evidência, categorias
- `Admin*` — CRUD + auditoria

## 6. Visualização do grafo

- Nó = ator; tamanho ∝ `normalizedScore`
- **Formas:** pessoa → círculo; instituição/órgão → hexágono; empresa → triângulo
- Aresta = relação; **sempre reta** (sem curvas); espessura ∝ `weight`
- Layout circular com minimização de cruzamentos; arestas paralelas do mesmo par usam retas paralelas deslocadas (sem coincidir)
- Estilo de aresta por `relationType` e `factStatus`
- Filtro temporal: relação/evento visível se intersecta o intervalo

## 7. Algoritmo de relevância (v1)

Ver `src/lib/relevance.ts` e página `/metodologia`.

```
raw =
  events×3 + relationships×2.5 + sources×1.5
  + officialEvidence×4 + decisions×3
  + recency×2 + degree×2 + importance×2

normalized = 100 × log1p(raw) / log1p(maxRaw)
```

## 8. Painel administrativo

CRUD de casos, atores, eventos, relações, fontes; status editorial; log de auditoria. IA em fila fica para fase 2.

## 9. Roadmap MVP → fases

**MVP (esta entrega):** home, casos, grafo, timeline, painéis, filtros, busca, relevância, status, admin básico, seed Banco Aurora.

**Fase 2:** IA com revisão, duplicidade, correções avançadas.

**Fase 3:** mapa geográfico, fluxo financeiro, grafo global.
