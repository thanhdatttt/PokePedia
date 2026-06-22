import { Injectable, Inject, Logger } from '@nestjs/common';
import Pokedex from 'pokedex-promise-v2';
import { sql } from 'drizzle-orm';
import { POKEDEX_CLIENT } from '../pokedex.provider';
import { DatabaseService } from '../../database/database.service';
import { stats } from '../../database/schema/pokemon';

const STAT_SHORT_NAMES: Record<string, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Spd',
};

@Injectable()
export class SyncStatsService {
  private readonly logger = new Logger(SyncStatsService.name);

  constructor(
    @Inject(POKEDEX_CLIENT) private readonly pokedex: Pokedex,
    private readonly db: DatabaseService,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Syncing stats...');

    const list = await this.pokedex.getStatsList();

    for (const item of list.results) {
      const stat = await this.pokedex.getStatByName(item.name);

      await this.db.db
        .insert(stats)
        .values({
          pokeApiId: stat.id,
          name: stat.name,
          shortName: STAT_SHORT_NAMES[stat.name] ?? stat.name,
        })
        .onConflictDoUpdate({
          target: stats.pokeApiId,
          set: {
            name: stat.name,
            shortName: STAT_SHORT_NAMES[stat.name] ?? stat.name,
            updatedAt: sql`now()`,
          },
        });
    }

    this.logger.log(`✓ Synced ${list.results.length} stats.`);
  }
}
