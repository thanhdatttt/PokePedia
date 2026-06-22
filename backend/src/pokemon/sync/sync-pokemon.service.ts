import { Injectable, Inject, Logger } from '@nestjs/common';
import Pokedex from 'pokedex-promise-v2';
import { eq, sql } from 'drizzle-orm';
import { POKEDEX_CLIENT } from '../pokedex.provider';
import { DatabaseService } from '../../database/database.service';
import {
  pokemon,
  pokemonSpecies,
  types,
  stats,
  abilities,
  pokemonTypes,
  pokemonStats,
  pokemonAbilities,
} from '../../database/schema/pokemon';

const BATCH_SIZE = 20;

@Injectable()
export class SyncPokemonService {
  private readonly logger = new Logger(SyncPokemonService.name);

  // In-memory caches — built once per run
  private speciesCache = new Map<string, string>(); // species name → uuid
  private typeCache = new Map<string, string>();    // type name → uuid
  private statCache = new Map<string, string>();    // stat name → uuid
  private abilityCache = new Map<string, string>(); // ability name → uuid

  constructor(
    @Inject(POKEDEX_CLIENT) private readonly pokedex: Pokedex,
    private readonly db: DatabaseService,
  ) {}

  async run(limit?: number): Promise<void> {
    this.logger.log('Syncing Pokémon...');

    await this.buildCaches();

    const list = await this.pokedex.getPokemonsList({ limit: limit ?? 2000 });
    const results = list.results;

    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const chunk = results.slice(i, i + BATCH_SIZE);
      await Promise.all(chunk.map((item) => this.syncOne(item.name)));
      this.logger.log(
        `  pokemon: ${Math.min(i + BATCH_SIZE, results.length)}/${results.length}`,
      );
    }

    this.logger.log(`✓ Synced ${results.length} Pokémon.`);
  }

  // ─── Single Pokémon ───────────────────────────────────────────────────────

  private async syncOne(name: string): Promise<void> {
    const p = await this.pokedex.getPokemonByName(name);

    const speciesId = this.speciesCache.get(p.species.name);
    if (!speciesId) {
      // Species not synced (can happen with very new entries); skip silently
      return;
    }

    // ── 1. Upsert the pokemon row ───────────────────────────────────────────
    const officialArtUrl =
      (p.sprites as any).other?.['official-artwork']?.front_default ?? null;

    const [pkmnRow] = await this.db.db
      .insert(pokemon)
      .values({
        pokeApiId: p.id,
        speciesId,
        slug: p.name,
        formName: p.forms?.[0]?.name !== p.name ? p.forms?.[0]?.name : null,
        height: p.height,
        weight: p.weight,
        baseExperience: p.base_experience ?? null,
        isDefault: p.is_default,
        isMega: p.name.includes('-mega'),
        isGmax: p.name.includes('-gmax'),
        spriteUrl: p.sprites.front_default ?? null,
        shinySpriteUrl: p.sprites.front_shiny ?? null,
        officialArtUrl,
      })
      .onConflictDoUpdate({
        target: pokemon.pokeApiId,
        set: {
          height: p.height,
          weight: p.weight,
          baseExperience: p.base_experience ?? null,
          spriteUrl: p.sprites.front_default ?? null,
          shinySpriteUrl: p.sprites.front_shiny ?? null,
          officialArtUrl,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: pokemon.id });

    const pokemonId = pkmnRow.id;

    // ── 2. Sync join tables concurrently ────────────────────────────────────
    await Promise.all([
      this.syncTypes(pokemonId, p.types),
      this.syncStats(pokemonId, p.stats),
      this.syncAbilities(pokemonId, p.abilities),
    ]);
  }

  // ─── Join tables ──────────────────────────────────────────────────────────

  private async syncTypes(pokemonId: string, apiTypes: any[]): Promise<void> {
    // Delete-then-insert: simpler than upsert on composite PK
    await this.db.db
      .delete(pokemonTypes)
      .where(eq(pokemonTypes.pokemonId, pokemonId));

    for (const t of apiTypes) {
      const typeId = this.typeCache.get(t.type.name);
      if (!typeId) continue;

      await this.db.db
        .insert(pokemonTypes)
        .values({ pokemonId, typeId, slot: t.slot })
        .onConflictDoNothing();
    }
  }

  private async syncStats(pokemonId: string, apiStats: any[]): Promise<void> {
    await this.db.db
      .delete(pokemonStats)
      .where(eq(pokemonStats.pokemonId, pokemonId));

    for (const s of apiStats) {
      const statId = this.statCache.get(s.stat.name);
      if (!statId) continue;

      await this.db.db
        .insert(pokemonStats)
        .values({
          pokemonId,
          statId,
          baseValue: s.base_stat,
          effort: s.effort,
        })
        .onConflictDoNothing();
    }
  }

  private async syncAbilities(pokemonId: string, apiAbilities: any[]): Promise<void> {
    await this.db.db
      .delete(pokemonAbilities)
      .where(eq(pokemonAbilities.pokemonId, pokemonId));

    for (const a of apiAbilities) {
      const abilityId = this.abilityCache.get(a.ability.name);
      if (!abilityId) continue;

      await this.db.db
        .insert(pokemonAbilities)
        .values({
          pokemonId,
          abilityId,
          isHidden: a.is_hidden,
          slot: a.slot,
        })
        .onConflictDoNothing();
    }
  }

  // ─── Cache builders ───────────────────────────────────────────────────────

  private async buildCaches(): Promise<void> {
    this.logger.log('  Building lookup caches...');

    const [speciesRows, typeRows, statRows, abilityRows] = await Promise.all([
      this.db.db.select({ id: pokemonSpecies.id, name: pokemonSpecies.name }).from(pokemonSpecies),
      this.db.db.select({ id: types.id, name: types.name }).from(types),
      this.db.db.select({ id: stats.id, name: stats.name }).from(stats),
      this.db.db.select({ id: abilities.id, name: abilities.name }).from(abilities),
    ]);

    for (const r of speciesRows) this.speciesCache.set(r.name, r.id);
    for (const r of typeRows)    this.typeCache.set(r.name, r.id);
    for (const r of statRows)    this.statCache.set(r.name, r.id);
    for (const r of abilityRows) this.abilityCache.set(r.name, r.id);

    this.logger.log(
      `  Cached: ${speciesRows.length} species, ${typeRows.length} types, ` +
      `${statRows.length} stats, ${abilityRows.length} abilities`,
    );
  }
}
