import { Injectable, Inject, Logger } from '@nestjs/common';
import Pokedex from 'pokedex-promise-v2';
import { eq, sql } from 'drizzle-orm';
import { POKEDEX_CLIENT } from '../pokedex.provider';
import { DatabaseService } from '../../database/database.service';
import {
  generations,
  pokemonSpecies,
  evolutionChains,
  evolutionChainNodes,
  items,
} from '../../database/schema/pokemon';

const BATCH_SIZE = 20;

@Injectable()
export class SyncSpeciesService {
  private readonly logger = new Logger(SyncSpeciesService.name);

  // In-memory caches to avoid redundant DB lookups within a single run
  private generationCache = new Map<string, string>(); // gen name → uuid
  private speciesCache = new Map<string, string>();    // species name → uuid
  private syncedChains = new Set<number>();            // pokeApiChainId already processed

  constructor(
    @Inject(POKEDEX_CLIENT) private readonly pokedex: Pokedex,
    private readonly db: DatabaseService,
  ) {}

  async run(limit?: number): Promise<void> {
    this.logger.log('Syncing Pokémon species...');
    this.generationCache.clear();
    this.speciesCache.clear();
    this.syncedChains.clear();

    await this.buildGenerationCache();

    const list = await this.pokedex.getPokemonSpeciesList({ limit: limit ?? 1300 });
    const results = list.results;

    // Pass 1: upsert all species rows
    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const chunk = results.slice(i, i + BATCH_SIZE);
      await Promise.all(chunk.map((item) => this.syncSpecies(item.name)));
      this.logger.log(
        `  species: ${Math.min(i + BATCH_SIZE, results.length)}/${results.length}`,
      );
    }

    // Pass 2: sync evolution chains (needs all species to exist first)
    this.logger.log('  Syncing evolution chains...');
    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const chunk = results.slice(i, i + BATCH_SIZE);
      await Promise.all(chunk.map((item) => this.syncEvolutionChainForSpecies(item.name)));
      this.logger.log(
        `  evo chains: ${Math.min(i + BATCH_SIZE, results.length)}/${results.length}`,
      );
    }

    this.logger.log(`✓ Synced ${results.length} species and their evolution chains.`);
  }

  // ─── Species ─────────────────────────────────────────────────────────────

  private async syncSpecies(name: string): Promise<void> {
    const species = await this.pokedex.getPokemonSpeciesByName(name);

    const generationId = this.generationCache.get(species.generation.name);
    if (!generationId) {
      this.logger.warn(`Generation not found for species ${name}: ${species.generation.name}`);
      return;
    }

    const flavorText =
      species.flavor_text_entries.find((e) => e.language.name === 'en')
        ?.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ') ?? null;

    const [row] = await this.db.db
      .insert(pokemonSpecies)
      .values({
        pokeApiId: species.id,
        name: species.name,
        slug: species.name, // PokeAPI names are already URL-safe slugs
        isLegendary: species.is_legendary,
        isMythical: species.is_mythical,
        isBaby: species.is_baby,
        captureRate: species.capture_rate,
        genderRate: species.gender_rate,
        hatchCounter: species.hatch_counter,
        baseHappiness: species.base_happiness ?? 70,
        generationId,
        flavorText,
      })
      .onConflictDoUpdate({
        target: pokemonSpecies.pokeApiId,
        set: {
          isLegendary: species.is_legendary,
          isMythical: species.is_mythical,
          isBaby: species.is_baby,
          captureRate: species.capture_rate,
          genderRate: species.gender_rate,
          hatchCounter: species.hatch_counter,
          baseHappiness: species.base_happiness ?? 70,
          flavorText,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: pokemonSpecies.id });

    this.speciesCache.set(species.name, row.id);
  }

  // ─── Evolution Chains ─────────────────────────────────────────────────────

  private async syncEvolutionChainForSpecies(name: string): Promise<void> {
    const species = await this.pokedex.getPokemonSpeciesByName(name);
    const chainUrl = species.evolution_chain?.url;
    if (!chainUrl) return;

    const chainPokeApiId = parseInt(chainUrl.split('/').filter(Boolean).at(-1)!);
    if (this.syncedChains.has(chainPokeApiId)) return; // already processed
    this.syncedChains.add(chainPokeApiId);

    try {
      const chainData = await this.pokedex.getEvolutionChainById(chainPokeApiId);

      const [chainRow] = await this.db.db
        .insert(evolutionChains)
        .values({ pokeApiId: chainData.id })
        .onConflictDoUpdate({
          target: evolutionChains.pokeApiId,
          set: { updatedAt: sql`now()` },
        })
        .returning({ id: evolutionChains.id });

      // Recursively walk the chain tree from the root node
      await this.walkNode(chainData.chain, chainRow.id, null);
    } catch (err) {
      this.logger.warn(`Failed to sync evolution chain ${chainPokeApiId}: ${err}`);
    }
  }

  private async walkNode(
    node: any,
    chainId: string,
    parentNodeId: string | null,
  ): Promise<void> {
    // Resolve species — may not be in cache if species sync was partial
    let speciesId = this.speciesCache.get(node.species.name);
    if (!speciesId) {
      const [row] = await this.db.db
        .select({ id: pokemonSpecies.id })
        .from(pokemonSpecies)
        .where(eq(pokemonSpecies.name, node.species.name));
      if (!row) return; // species doesn't exist yet, skip
      speciesId = row.id;
      this.speciesCache.set(node.species.name, speciesId);
    }

    const details = node.evolution_details?.[0] ?? null;

    // Resolve optional item FKs
    const itemId = details?.item?.name
      ? await this.resolveItemId(details.item.name)
      : null;

    const heldItemId = details?.held_item?.name
      ? await this.resolveItemId(details.held_item.name)
      : null;

    const [evoNode] = await this.db.db
      .insert(evolutionChainNodes)
      .values({
        chainId,
        speciesId,
        parentNodeId,
        trigger: details ? this.mapTrigger(details.trigger?.name) : null,
        minLevel: details?.min_level ?? null,
        itemId,
        heldItemId,
        minHappiness: details?.min_happiness ?? null,
        minAffection: details?.min_affection ?? null,
        minBeauty: details?.min_beauty ?? null,
        timeOfDay: details?.time_of_day || null,
        genderRequired: this.mapGender(details?.gender),
        needsRain: details?.needs_overworld_rain ?? false,
        turnUpsideDown: details?.turn_upside_down ?? false,
        // knownMoveType comes as type name string from PokeAPI
        knownMoveType: details?.known_move_type?.name ?? null,
        locationRequired: details?.location?.name ?? null,
        relativePhysicalStats: details?.relative_physical_stats ?? null,
        partyTypeRequired: details?.party_type?.name ?? null,
      })
      .onConflictDoNothing()
      .returning({ id: evolutionChainNodes.id });

    if (!evoNode) return; // already exists, skip children (they exist too)

    // Recurse into evolutions
    for (const child of node.evolves_to ?? []) {
      await this.walkNode(child, chainId, evoNode.id);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async buildGenerationCache(): Promise<void> {
    const rows = await this.db.db
      .select({ id: generations.id, name: generations.name })
      .from(generations);

    for (const row of rows) {
      this.generationCache.set(row.name, row.id);
    }
  }

  private async resolveItemId(itemName: string): Promise<string | null> {
    const [row] = await this.db.db
      .select({ id: items.id })
      .from(items)
      .where(eq(items.name, itemName));
    return row?.id ?? null;
  }

  private mapTrigger(
    name?: string,
  ): 'level_up' | 'use_item' | 'trade' | 'shed' | 'other' {
    const map: Record<string, 'level_up' | 'use_item' | 'trade' | 'shed' | 'other'> = {
      'level-up': 'level_up',
      'use-item': 'use_item',
      'trade': 'trade',
      'shed': 'shed',
    };
    return map[name ?? ''] ?? 'other';
  }

  private mapGender(gender: number | null | undefined): 'male' | 'female' | null {
    if (gender === 1) return 'female';
    if (gender === 2) return 'male';
    return null;
  }
}
