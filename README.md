# RASTRO

Cada fato deixa um rastro. O RASTRO conecta tudo.

Plataforma de visualização e exploração de acontecimentos públicos complexos — atores, eventos, relações, fontes e evidências em um grafo temporal.

## Stack (MVP)

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite
- React Flow (`@xyflow/react`) para o grafo

## Desenvolvimento

```bash
npm install
cp .env.example .env   # se necessário
npx prisma migrate dev
npm run db:seed
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Caso de teste: **Caso Banco Aurora** em `/casos/banco-aurora`.

## Documentação

Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — arquitetura, modelo de dados, relevância, roadmap.

## Princípios

- Presença no mapa ≠ culpa
- Toda afirmação relevante exige fonte
- Status do fato e nível de evidência são explícitos
- Núcleo: Atores → Eventos → Relações → Fontes → Grafo → Timeline
