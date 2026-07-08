import Pokedex from 'pokedex-promise-v2';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { POKEDEX_CLIENT, BATCH_SIZE } from 'src/common/constants/pokeapi.constant';
import { DatabaseService } from '../../database/database.service';
import { moves, types } from '../../database/schema/pokemon';

@Injectable()
export class SyncMovesService {
  private readonly logger = new Logger(SyncMovesService.name);

  // Cache type name → uuid, built once per run to avoid per-move DB lookups
  private typeCache = new Map<string, string>();

  constructor(
    @Inject(POKEDEX_CLIENT) private readonly pokedex: Pokedex,
    private readonly db: DatabaseService,
  ) { }

  async run(limit?: number): Promise<void> {
    this.logger.log('Syncing moves...');

    await this.buildTypeCache();

    // PokeAPI has ~920 moves as of Gen 9. We fetch all by default.
    const list = await this.pokedex.getMovesList({ limit: limit ?? 1000 });
    const results = list.results;

    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const chunk = results.slice(i, i + BATCH_SIZE);

      await Promise.all(chunk.map((item) => this.syncOne(item.name)));

      this.logger.log(
        `  moves: ${Math.min(i + BATCH_SIZE, results.length)}/${results.length}`,
      );
    }

    this.logger.log(`✓ Synced ${results.length} moves.`);
  }

  // Single move
  private async syncOne(name: string): Promise<void> {
    const move = await this.pokedex.getMoveByName(name);

    // Skip internal/placeholder moves (id > 10000 are game-internal)
    if (move.id > 10000) return;

    const typeId = this.typeCache.get(move.type.name);
    if (!typeId) {
      // Unknown type — shouldn't happen after types are synced, but guard anyway
      this.logger.warn(`Unknown type "${move.type.name}" for move "${move.name}" — skipping.`);
      return;
    }

    // short_effect is concise; full effect is often very long
    const effect =
      move.effect_entries.find((e) => e.language.name === 'en')?.short_effect ?? null;

    // Prefer the most recent English flavor text entry
    const englishFlavors = move.flavor_text_entries.filter(
      (e) => e.language.name === 'en',
    );
    const flavorText =
      englishFlavors.length > 0
        ? englishFlavors[englishFlavors.length - 1].flavor_text
          .replace(/\f/g, ' ')
          .replace(/\n/g, ' ')
        : null;

    await this.db.db
      .insert(moves)
      .values({
        pokeApiId: move.id,
        name: move.name,
        accuracy: move.accuracy ?? null,     // null = never misses (e.g. Swift)
        power: move.power ?? null,            // null = status moves (e.g. Thunder Wave)
        pp: move.pp ?? null,
        priority: move.priority ?? 0,
        damageClass: move.damage_class.name, // "physical" | "special" | "status"
        moveTypeId: typeId,
        effect,
        flavorText,
      })
      .onConflictDoUpdate({
        target: moves.pokeApiId,
        set: {
          // Fields that can change between game updates
          accuracy: move.accuracy ?? null,
          power: move.power ?? null,
          pp: move.pp ?? null,
          priority: move.priority ?? 0,
          damageClass: move.damage_class.name,
          moveTypeId: typeId,
          effect,
          flavorText,
          updatedAt: sql`now()`,
        },
      });
  }

  // Cache builder
  private async buildTypeCache(): Promise<void> {
    const rows = await this.db.db
      .select({ id: types.id, name: types.name })
      .from(types);

    for (const row of rows) {
      this.typeCache.set(row.name, row.id);
    }

    this.logger.log(`  Cached ${rows.length} types for move sync.`);
  }
}
