import { isGrandJunctionParentZone } from './zone-learning.ts'

const GRAND_JUNCTION_PARENT_BLOCK = '__grand_junction_parent_block__'

function normalizeGrandJunctionParentBlock(flow: string[]) {
  const normalized: string[] = []

  for (const zone of flow) {
    const value = isGrandJunctionParentZone(zone) ? GRAND_JUNCTION_PARENT_BLOCK : zone
    if (normalized.at(-1) !== value) normalized.push(value)
  }

  return normalized
}

export function preservesVerifiedMacroFlow(candidateFlow: string[], expectedFlow: string[]) {
  if (new Set(candidateFlow).size !== candidateFlow.length) return false
  if (candidateFlow.length !== expectedFlow.length) return false
  if (candidateFlow.some((zone) => !expectedFlow.includes(zone))) return false

  return JSON.stringify(normalizeGrandJunctionParentBlock(candidateFlow)) ===
    JSON.stringify(normalizeGrandJunctionParentBlock(expectedFlow))
}
