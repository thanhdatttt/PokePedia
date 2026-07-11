import { PokemonType, TypeChart, TypeEffectiveness } from "@/types/pokemonType";

export const TYPE_ICONS: Record<string, string> = {
  normal: '/typeIcons/normal.svg',
  fire: '/typeIcons/fire.svg',
  water: '/typeIcons/water.svg',
  grass: '/typeIcons/grass.svg',
  electric: '/typeIcons/electric.svg',
  ice: '/typeIcons/ice.svg',
  fighting: '/typeIcons/fighting.svg',
  poison: '/typeIcons/poison.svg',
  ground: '/typeIcons/ground.svg',
  flying: '/typeIcons/flying.svg',
  psychic: '/typeIcons/psychic.svg',
  bug: '/typeIcons/bug.svg',
  rock: '/typeIcons/rock.svg',
  ghost: '/typeIcons/ghost.svg',
  dragon: '/typeIcons/dragon.svg',
  dark: '/typeIcons/dark.svg',
  steel: '/typeIcons/steel.svg',
  fairy: '/typeIcons/fairy.svg',
};

export function getTypeIcon(typeName: string): string {
  return TYPE_ICONS[typeName.toLowerCase()] ?? '/typeIcons/normal.svg';
}

export function computeEffectiveness(
  { types, chart }: TypeChart,
  defendingTypeNames: string[],
): TypeEffectiveness {
  const weaknesses: TypeEffectiveness["weaknesses"] = [];
  const resistances: TypeEffectiveness["resistances"] = [];
  const immunities: TypeEffectiveness["immunities"] = [];

  for (const attacker of types) {
    let multiplier = 1;
    for (const defendingName of defendingTypeNames) {
      multiplier *= chart[attacker.name]?.[defendingName] ?? 1;
    }

    if (multiplier === 0) immunities.push({ type: attacker.name, multiplier });
    else if (multiplier > 1) weaknesses.push({ type: attacker.name, multiplier });
    else if (multiplier < 1) resistances.push({ type: attacker.name, multiplier });
    // multiplier === 1 -> neutral, intentionally omitted
  }

  weaknesses.sort((a, b) => b.multiplier - a.multiplier);
  resistances.sort((a, b) => a.multiplier - b.multiplier);

  return { weaknesses, resistances, immunities };
}

export function formatMultiplier(multiplier: number): string {
  if (multiplier === 0) return "0x";
  if (multiplier === 0.5) return "1/2x";
  if (multiplier === 2) return "2x";
  if (multiplier === 4) return "4x";
  if (multiplier === 0.25) return "1/4x";
  return `${multiplier}x`;
}

export function multiplierBucket(
  multiplier: number,
): "immune" | "resist" | "neutral" | "weak" {
  if (multiplier === 0) return "immune";
  if (multiplier < 1) return "resist";
  if (multiplier > 1) return "weak";
  return "neutral";
}

export function sortTypesAlphabetically(types: PokemonType[]): PokemonType[] {
  return [...types].sort((a, b) => a.name.localeCompare(b.name));
}