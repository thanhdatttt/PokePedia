import { Injectable, Logger } from '@nestjs/common';
import { SyncGenerationsService } from './sync-generations.service';
import { SyncTypesService } from './sync-types.service';
import { SyncStatsService } from './sync-stats.service';
import { SyncAbilitiesService } from './sync-abilities.service';
import { SyncItemsService } from './sync-items.service';
import { SyncSpeciesService } from './sync-species.service';
import { SyncPokemonService } from './sync-pokemon.service';
import { RedisService } from 'src/redis/redis.service';
import { SyncMovesService } from './sync-moves.service';
import { SyncPokemonMovesService } from './sync-pokemon-moves.service';

export interface SyncOptions {
  limit?: number;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private running = false;

  constructor(
    private readonly syncGenerations: SyncGenerationsService,
    private readonly syncTypes: SyncTypesService,
    private readonly syncStats: SyncStatsService,
    private readonly syncAbilities: SyncAbilitiesService,
    private readonly syncItems: SyncItemsService,
    private readonly syncMoves: SyncMovesService,
    private readonly syncPokemonMoves: SyncPokemonMovesService,
    private readonly syncSpecies: SyncSpeciesService,
    private readonly syncPokemon: SyncPokemonService,
    private readonly redisService: RedisService,
  ) { }

  async syncAll(options: SyncOptions = {}): Promise<void> {
    if (this.running) {
      this.logger.warn('Sync already in progress — skipping.');
      return;
    }

    this.running = true;
    const start = Date.now();
    this.logger.log('  Starting full PokéAPI sync');
    if (options.limit) this.logger.log(`  (dev mode: limit=${options.limit})`);

    try {
      // No dependencies 
      await this.syncGenerations.run();
      await this.syncTypes.run();
      await this.syncStats.run();
      await this.syncAbilities.run(options.limit);
      await this.syncItems.run(options.limit);

      // Needs types
      await this.syncMoves.run(options.limit);

      // Needs generations + items
      // Species also creates evolution chains (needs species + items to exist)
      await this.syncSpecies.run(options.limit);

      // Needs species + types + stats + abilities
      await this.syncPokemon.run(options.limit);

      // reset redis cache evolution as new sync
      await this.redisService.delByPattern('evolution-chain:*');

      // Needs pokemon + moves
      await this.syncPokemonMoves.run(options.limit);

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      this.logger.log(`  Sync complete in ${elapsed}s`);
    } catch (err) {
      this.logger.error('Sync failed:', err);
      throw err;
    } finally {
      this.running = false;
    }
  }

  isRunning(): boolean {
    return this.running;
  }
}
