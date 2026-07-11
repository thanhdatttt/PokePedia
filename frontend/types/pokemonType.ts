export interface PokemonType {
  name: string;
  color: string; // hex color
}

export interface TypeChart {
  types: PokemonType[];
  // chart[attackingTypeName][defendingTypeName] = multiplier (0 | 0.5 | 1 | 2)
  chart: Record<string, Record<string, number>>;
}

export interface TypeEffectivenessEntry {
  type: string;
  multiplier: number;
}

export interface TypeEffectiveness {
  weaknesses: TypeEffectivenessEntry[]; // > 1x
  resistances: TypeEffectivenessEntry[]; // 0 < x < 1
  immunities: TypeEffectivenessEntry[]; // = 0
}

export interface TypeDetail {
  name: string;
  color: string;
  offensive: {
    superEffectiveAgainst: string[];
    notVeryEffectiveAgainst: string[];
    noEffectAgainst: string[];
  };
  defensive: {
    weakTo: string[];
    resistantTo: string[];
    immuneTo: string[];
  };
}

// The multiplier values
export type Multiplier = 0 | 0.5 | 1 | 2;