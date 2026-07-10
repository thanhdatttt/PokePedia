import Pokedex from 'pokedex-promise-v2';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { POKEDEX_CLIENT, BATCH_SIZE } from 'src/common/constants/pokeapi.constant';
import { DatabaseService } from '../../database/database.service';
import { pokemon, moves, pokemonMoves } from '../../database/schema/pokemon';

/**
 * SyncPokemonMovesService
 *
 * Populates the `pokemon_moves` join table from PokeAPI.
 * Must run AFTER SyncMovesService and SyncPokemonService.
 *
 * PokeAPI shape (on the Pokémon resource):
 *
 *   pokemon.moves: Array<{
 *     move: { name: string, url: string }
 *     version_group_details: Array<{
 *       level_learned_at: number       // 0 for non-level-up methods
 *       move_learn_method: { name: string }  // "level-up" | "machine" | "egg" | "tutor" | ...
 *       version_group: { name: string, url: string }
 *     }>
 *   }>
 *
 * Schema composite PK: (pokemonId, moveId, learnMethod, versionGroupId)
 * → One row per (pokemon × move × method × version-group).
 *   A single move can appear multiple times if it's learnable via different
 *   methods or in different version groups (e.g. Tackle via level-up in Gen 1
 *   AND via egg in Gen 2).
 *
 * learnMethodEnum values:
 *   'level_up' | 'machine' | 'egg' | 'tutor' | 'transfer' | 'reminder'
 *
 * levelLearnedAt:
 *   Populated only for 'level_up' entries. PokeAPI gives `level_learned_at = 0`
 *   for all non-level-up entries — we store null in that case to match the schema.
 *
 * versionGroupId:
 *   The integer ID extracted from the version_group URL, e.g.
 *   "https://pokeapi.co/api/v2/version-group/1/" → 1
 */
@Injectable()
export class SyncPokemonMovesService {
  private readonly logger = new Logger(SyncPokemonMovesService.name);

  // Cache name → uuid, built once per run
  private pokemonCache = new Map<string, string>(); // slug → uuid
  private moveCache = new Map<string, string>();    // move name → uuid

  constructor(
    @Inject(POKEDEX_CLIENT) private readonly pokedex: Pokedex,
    private readonly db: DatabaseService,
  ) { }

  async run(limit?: number): Promise<void> {
    this.logger.log('Syncing pokemon_moves learnsets...');

    await this.buildCaches();

    const list = await this.pokedex.getPokemonsList({ limit: limit ?? 2000 });
    const results = list.results;

    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const chunk = results.slice(i, i + BATCH_SIZE);
      await Promise.all(chunk.map((item) => this.syncOne(item.name)));
      this.logger.log(
        `  pokemon_moves: ${Math.min(i + BATCH_SIZE, results.length)}/${results.length}`,
      );
    }

    this.logger.log(`✓ Synced pokemon_moves for ${results.length} Pokémon.`);
  }

  // Single Pokémon
  private async syncOne(name: string): Promise<void> {
    const p = await this.pokedex.getPokemonByName(name);

    const pokemonId = this.pokemonCache.get(p.name);
    if (!pokemonId) {
      // Pokémon form not yet synced — skip silently
      return;
    }

    // Delete all existing learnset rows for this Pokémon before reinserting.
    await this.db.db
      .delete(pokemonMoves)
      .where(eq(pokemonMoves.pokemonId, pokemonId));

    // Build insert rows — one per (move × method × versionGroup)
    const rows: (typeof pokemonMoves.$inferInsert)[] = [];

    for (const moveEntry of p.moves) {
      const moveId = this.moveCache.get(moveEntry.move.name);
      if (!moveId) {
        // Move wasn't synced (likely id > 10000 internal move) — skip
        continue;
      }

      for (const detail of moveEntry.version_group_details) {
        const learnMethod = this.mapLearnMethod(detail.move_learn_method.name);
        if (!learnMethod) {
          // Unknown learn method — skip rather than crash
          continue;
        }

        // Extract integer ID from URL: ".../version-group/15/" → 15
        const versionGroupId = this.extractIdFromUrl(detail.version_group.url);
        if (!versionGroupId) continue;

        // Only populate levelLearnedAt for level-up entries
        const levelLearnedAt =
          learnMethod === 'level_up' && detail.level_learned_at > 0
            ? detail.level_learned_at
            : null;

        rows.push({
          pokemonId,
          moveId,
          learnMethod,
          versionGroupId,
          levelLearnedAt,
        });
      }
    }

    if (rows.length === 0) return;

    // Insert in chunks of 500 to avoid hitting Postgres parameter limits
    // (~65535 params / 5 columns per row = ~13000 rows max, but 500 is safe)
    const INSERT_CHUNK = 500;
    for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
      const chunk = rows.slice(i, i + INSERT_CHUNK);
      await this.db.db
        .insert(pokemonMoves)
        .values(chunk)
        .onConflictDoNothing(); // composite PK guards against duplicates
    }
  }

  // Helpers
  private mapLearnMethod(
    apiMethod: string,
  ): typeof pokemonMoves.$inferInsert['learnMethod'] | null {
    const map: Record<string, typeof pokemonMoves.$inferInsert['learnMethod']> = {
      'level-up': 'level_up',
      'machine': 'machine',    // TM / HM / TR
      'egg': 'egg',
      'tutor': 'tutor',
      // Transfer methods (Bank, HOME, Transporter, etc.)
      'light-ball-egg': 'transfer',
      'colosseum-purification': 'transfer',
      'xd-shadow': 'transfer',
      'xd-purification': 'transfer',
      'form-change': 'transfer',
      'zygarde-cube': 'transfer',
      // Reminder = Move Reminder / Heart Scale NPC
      'reminder': 'reminder',
    };
    return map[apiMethod] ?? null;
  }

  /** Extracts the trailing integer from a PokeAPI URL segment. */
  private extractIdFromUrl(url: string): number | null {
    const parts = url.split('/').filter(Boolean);
    const raw = parts.at(-1);
    if (!raw) return null;
    const id = parseInt(raw, 10);
    return isNaN(id) ? null : id;
  }

  // Cache builders
  private async buildCaches(): Promise<void> {
    this.logger.log('  Building lookup caches...');

    const [pokemonRows, moveRows] = await Promise.all([
      this.db.db.select({ id: pokemon.id, slug: pokemon.slug }).from(pokemon),
      this.db.db.select({ id: moves.id, name: moves.name }).from(moves),
    ]);

    for (const r of pokemonRows) this.pokemonCache.set(r.slug, r.id);
    for (const r of moveRows) this.moveCache.set(r.name, r.id);

    this.logger.log(
      `  Cached ${pokemonRows.length} pokemon, ${moveRows.length} moves.`,
    );
  }
}
