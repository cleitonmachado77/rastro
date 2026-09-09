import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import {
  createActorAction,
  createCaseAction,
  createEventAction,
  createRelationshipAction,
  createSourceAction,
  updateCaseSituationAction,
} from "./actions";
import { FACT_STATUS_LABELS, EVIDENCE_LEVEL_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [cases, actors, events, relationships, sources, audits] =
    await Promise.all([
      prisma.case.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          _count: {
            select: { caseActors: true, events: true, relationships: true },
          },
        },
      }),
      prisma.actor.findMany({
        orderBy: { name: "asc" },
        include: { caseActors: { include: { case: true } } },
      }),
      prisma.event.findMany({
        orderBy: { startDate: "desc" },
        take: 30,
        include: { case: true },
      }),
      prisma.relationship.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { fromActor: true, toActor: true, case: true },
      }),
      prisma.source.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
        include: { user: true },
      }),
    ]);

  const defaultCaseId = cases[0]?.id ?? "";

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 py-12 flex-1">
      <p className="mono text-[10px] tracking-widest uppercase text-[var(--fg-faint)]">
        Controle editorial
      </p>
      <h1 className="display text-3xl mt-2">Painel administrativo</h1>
      <p className="mt-3 max-w-2xl text-[var(--fg-muted)]">
        CRUD inicial de casos, atores, eventos, relações e fontes. Toda ação
        gera registro em auditoria. Autenticação completa fica para fase
        seguinte — neste MVP o editor seedado assina as operações.
      </p>

      <div className="mt-10 grid lg:grid-cols-2 gap-6">
        <AdminCard title="Novo caso">
          <form action={createCaseAction} className="space-y-3">
            <Field label="Nome" name="name" required />
            <Field label="Descrição" name="description" textarea required />
            <Field label="Situação atual" name="currentSituation" textarea />
            <label className="flex items-center gap-2 text-sm text-[var(--fg-muted)]">
              <input type="checkbox" name="featured" /> Destaque na home
            </label>
            <button type="submit" className="btn btn-primary">
              Criar caso
            </button>
          </form>
        </AdminCard>

        <AdminCard title="Atualizar situação do caso">
          <form action={updateCaseSituationAction} className="space-y-3">
            <SelectCase name="caseId" cases={cases} defaultValue={defaultCaseId} />
            <Field label="Situação atual" name="currentSituation" textarea required />
            <button type="submit" className="btn btn-primary">
              Salvar
            </button>
          </form>
        </AdminCard>

        <AdminCard title="Novo ator">
          <form action={createActorAction} className="space-y-3">
            <SelectCase name="caseId" cases={cases} defaultValue={defaultCaseId} />
            <Field label="Nome" name="name" required />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Tipo</label>
                <select name="actorKind" className="input">
                  <option value="person">Pessoa</option>
                  <option value="organization">Organização</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <Field label="Função / primaryType" name="primaryType" placeholder="empresario" />
            </div>
            <Field label="Descrição" name="description" textarea />
            <button type="submit" className="btn btn-primary">
              Criar ator
            </button>
          </form>
        </AdminCard>

        <AdminCard title="Novo evento">
          <form action={createEventAction} className="space-y-3">
            <SelectCase name="caseId" cases={cases} defaultValue={defaultCaseId} />
            <Field label="Título" name="title" required />
            <Field label="Descrição" name="description" textarea required />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo" name="eventType" placeholder="contrato" />
              <Field label="Data" name="startDate" type="date" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Status do fato</label>
                <select name="factStatus" className="input">
                  {Object.entries(FACT_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Evidência</label>
                <select name="evidenceLevel" className="input">
                  {Object.entries(EVIDENCE_LEVEL_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Ator envolvido (opcional)</label>
              <select name="actorId" className="input" defaultValue="">
                <option value="">—</option>
                {actors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Criar evento
            </button>
          </form>
        </AdminCard>

        <AdminCard title="Nova relação">
          <form action={createRelationshipAction} className="space-y-3">
            <SelectCase name="caseId" cases={cases} defaultValue={defaultCaseId} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Origem</label>
                <select name="fromActorId" className="input" required>
                  {actors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Destino</label>
                <select name="toActorId" className="input" required>
                  {actors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo" name="relationType" placeholder="contrato" required />
              <Field label="Peso" name="weight" type="number" defaultValue="1" />
            </div>
            <Field label="Descrição" name="description" textarea />
            <Field label="Data início" name="startDate" type="date" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Status</label>
                <select name="factStatus" className="input">
                  {Object.entries(FACT_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Evidência</label>
                <select name="evidenceLevel" className="input">
                  {Object.entries(EVIDENCE_LEVEL_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Criar relação
            </button>
          </form>
        </AdminCard>

        <AdminCard title="Nova fonte">
          <form action={createSourceAction} className="space-y-3">
            <SelectCase name="caseId" cases={cases} defaultValue={defaultCaseId} />
            <Field label="Título" name="title" required />
            <Field label="URL" name="url" placeholder="https://" />
            <Field label="Veículo / instituição" name="outlet" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Tipo</label>
                <select name="sourceType" className="input">
                  <option value="journalistic">Jornalística</option>
                  <option value="institutional">Institucional</option>
                  <option value="documentary">Documental</option>
                </select>
              </div>
              <div>
                <label className="label">Evidência</label>
                <select name="evidenceLevel" className="input">
                  {Object.entries(EVIDENCE_LEVEL_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Field label="Trecho (curto)" name="excerpt" textarea />
            <div>
              <label className="label">Vincular a evento (opcional)</label>
              <select name="eventId" className="input" defaultValue="">
                <option value="">—</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Adicionar fonte
            </button>
          </form>
        </AdminCard>
      </div>

      <section className="mt-12">
        <h2 className="display text-2xl">Casos</h2>
        <ul className="mt-4 space-y-2">
          {cases.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-[var(--line)] px-4 py-3"
            >
              <div>
                <Link
                  href={`/casos/${c.slug}`}
                  className="display text-lg hover:text-[var(--accent)]"
                >
                  {c.name}
                </Link>
                <p className="mono text-[11px] text-[var(--fg-faint)] mt-1">
                  {c._count.caseActors} atores · {c._count.events} eventos ·{" "}
                  {c._count.relationships} relações · {c.status}
                </p>
              </div>
              <span className="chip">{c.slug}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="display text-xl">Eventos recentes</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {events.map((e) => (
              <li key={e.id} className="border border-[var(--line)] px-3 py-2">
                <span className="text-[var(--fg)]">{e.title}</span>
                <span className="block mono text-[10px] text-[var(--fg-faint)] mt-1">
                  {e.case.name} ·{" "}
                  {FACT_STATUS_LABELS[e.factStatus] ?? e.factStatus} ·{" "}
                  {format(e.startDate, "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="display text-xl">Relações</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {relationships.map((r) => (
              <li key={r.id} className="border border-[var(--line)] px-3 py-2">
                {r.fromActor.name} → {r.toActor.name}
                <span className="block mono text-[10px] text-[var(--fg-faint)] mt-1">
                  {r.relationType} · {r.case.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="display text-xl">Fontes</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {sources.map((s) => (
            <li key={s.id} className="border border-[var(--line)] px-3 py-2">
              {s.title}
              <span className="block mono text-[10px] text-[var(--fg-faint)] mt-1">
                {s.outlet} · {s.sourceType}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="display text-2xl">Histórico / auditoria</h2>
        <ul className="mt-4 space-y-2">
          {audits.map((a) => (
            <li
              key={a.id}
              className="border border-[var(--line)] px-4 py-3 mono text-[11px] text-[var(--fg-muted)]"
            >
              <span className="text-[var(--fg)]">
                {a.action} · {a.entityType}
              </span>{" "}
              · {a.entityId.slice(0, 8)}…
              {a.user ? ` · ${a.user.name}` : ""}
              {a.reason ? ` · ${a.reason}` : ""}
              <span className="block text-[var(--fg-faint)] mt-1">
                {format(a.createdAt, "dd MMM yyyy HH:mm", { locale: ptBR })}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function AdminCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-[var(--line)] p-5">
      <h2 className="display text-lg mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  textarea,
  type = "text",
  required,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  textarea?: boolean;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          className="input min-h-[80px]"
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          className="input"
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
        />
      )}
    </div>
  );
}

function SelectCase({
  name,
  cases,
  defaultValue,
}: {
  name: string;
  cases: Array<{ id: string; name: string }>;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="label">Caso</label>
      <select name={name} className="input" defaultValue={defaultValue} required>
        {cases.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
