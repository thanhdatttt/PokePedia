import { Injectable, NotFoundException } from "@nestjs/common";
import { asc, eq } from 'drizzle-orm';
import { alias } from "drizzle-orm/pg-core";
import { TYPE_CHART_CACHE_TTL } from "src/common/constants/pokeapi.constant";
import { DatabaseService } from "src/database/database.service";
import { typeRelations, types } from "src/database/schema/pokemon";
import { RedisService } from "src/redis/redis.service";

export interface TypeChart {
  types: { name: string; color: string }[];
  // chart[attackingTypeName][defendingTypeName] = multiplier
  chart: Record<string, Record<string, number>>;
}

export interface TypeEffectiveness {
  weaknesses: { type: string; multiplier: number }[];   // > 1x
  resistances: { type: string; multiplier: number }[];  // 0 < x < 1
  immunities: { type: string; multiplier: number }[];   // = 0
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

@Injectable()
export class TypeService {
  constructor(
    private readonly db: DatabaseService,
    private readonly redisService: RedisService,
  ) {}

  async getAllTypes() {
    return this.db.db
      .select({ name: types.name, color: types.color })
      .from(types)
      .orderBy(asc(types.pokeApiId));
  }

  // Full effectiveness matrix, built from the stored exceptions plus a
  // default of 1x (neutral) for every pair that has no row in type_relations.
  async getChart(): Promise<TypeChart> {
    // check cache
    const cacheKey = 'type-chart';
    const cached = await this.redisService.get<TypeChart>(cacheKey);
    if (cached !== null) return cached;

    const allTypes = await this.getAllTypes();

    // get all exceptions (multiplier != 1)
    const attackingType = alias(types, 'attacking_type');
    const defendingType = alias(types, 'defending_type');
    const exceptions = await this.db.db
      .select({
        attackingName: attackingType.name,
        defendingName: defendingType.name,
        multiplier: typeRelations.multiplier,
      })
      .from(typeRelations)
      .innerJoin(attackingType, eq(typeRelations.attackingTypeId, attackingType.id))
      .innerJoin(defendingType, eq(typeRelations.defendingTypeId, defendingType.id));

    const chart: Record<string, Record<string, number>> = {};
    // default neutral (1x) for all types
    for (const attacker of allTypes) {
      chart[attacker.name] = {};
      for (const defender of allTypes) {
        chart[attacker.name][defender.name] = 1;
      }
    }
    // add exceptions
    for (const ex of exceptions) {
      chart[ex.attackingName][ex.defendingName] = ex.multiplier;
    }

    const result: TypeChart = { types: allTypes, chart };
    await this.redisService.set(cacheKey, result, TYPE_CHART_CACHE_TTL);
    return result;
  }

  // Combined defensive effectiveness for a Pokemon with 1 or 2 types.
  // Multipliers stack multiplicatively across types
  async getEffectiveness(defendingTypeNames: string[]): Promise<TypeEffectiveness> {
    const { types: allTypes, chart } = await this.getChart();

    const weaknesses: { type: string; multiplier: number }[] = [];
    const resistances: { type: string; multiplier: number }[] = [];
    const immunities: { type: string; multiplier: number }[] = [];

    for (const attacker of allTypes) {
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

  async getByName(name: string): Promise<TypeDetail> {
  const { types: allTypes, chart } = await this.getChart();

  const target = allTypes.find((t) => t.name === name);
  if (!target || !chart[name]) {
    throw new NotFoundException(`Type "${name}" not found`);
  }

  const offensive = {
    superEffectiveAgainst: [] as string[],
    notVeryEffectiveAgainst: [] as string[],
    noEffectAgainst: [] as string[],
  };
  for (const defender of allTypes) {
    const multiplier = chart[name][defender.name];
    if (multiplier === 2) offensive.superEffectiveAgainst.push(defender.name);
    else if (multiplier === 0.5) offensive.notVeryEffectiveAgainst.push(defender.name);
    else if (multiplier === 0) offensive.noEffectAgainst.push(defender.name);
  }

  const defensive = {
    weakTo: [] as string[],
    resistantTo: [] as string[],
    immuneTo: [] as string[],
  };
  for (const attacker of allTypes) {
    const multiplier = chart[attacker.name][name];
    if (multiplier === 2) defensive.weakTo.push(attacker.name);
    else if (multiplier === 0.5) defensive.resistantTo.push(attacker.name);
    else if (multiplier === 0) defensive.immuneTo.push(attacker.name);
  }

  return { name: target.name, color: target.color, offensive, defensive };
}
}