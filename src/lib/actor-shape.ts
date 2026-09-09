/** Forma visual do nó no grafo RASTRO */
export type ActorShape = "circle" | "hexagon" | "triangle";

const COMPANY_TYPES = new Set([
  "empresa",
  "banco",
  "associacao",
  "sindicato",
  "ong",
  "organizacao_privada",
  "instituicao_financeira",
]);

const INSTITUTION_TYPES = new Set([
  "orgao",
  "tribunal",
  "ministerio_publico",
  "policia_federal",
  "policia_civil",
  "tcu",
  "cgu",
  "camara",
  "senado",
  "prefeitura",
  "governo_estadual",
  "governo_federal",
  "partido",
  "entidade_reguladora",
]);

/**
 * pessoa → círculo
 * instituição/órgão → hexágono
 * empresa → triângulo
 */
export function resolveActorShape(
  actorKind: string,
  primaryType: string
): ActorShape {
  const type = primaryType.toLowerCase().replace(/\s+/g, "_");

  if (COMPANY_TYPES.has(type)) return "triangle";
  if (INSTITUTION_TYPES.has(type)) return "hexagon";

  if (actorKind === "person") return "circle";
  if (actorKind === "organization") {
    // organizações sem tipo específico: preferir hexágono institucional
    // exceto se o nome/tipo sugerir empresa
    if (type.includes("empresa") || type.includes("banco")) return "triangle";
    return "hexagon";
  }

  return "circle";
}

export const ACTOR_SHAPE_LABELS: Record<ActorShape, string> = {
  circle: "Pessoa",
  hexagon: "Instituição / órgão",
  triangle: "Empresa",
};
