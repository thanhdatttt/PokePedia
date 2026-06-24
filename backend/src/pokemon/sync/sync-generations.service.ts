import Pokedex from 'pokedex-promise-v2';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { POKEDEX_CLIENT } from 'src/common/constants/pokeapi.constant';
import { DatabaseService } from '../../database/database.service';
import { generations } from '../../database/schema/pokemon';

@Injectable()
export class SyncGenerationsService {
  private readonly logger = new Logger(SyncGenerationsService.name);

  constructor(
    @Inject(POKEDEX_CLIENT) private readonly pokedex: Pokedex,
    private readonly db: DatabaseService,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Syncing generations...');

    const list = await this.pokedex.getGenerationsList();

    for (const item of list.results) {
      const gen = await this.pokedex.getGenerationByName(item.name);

      await this.db.db
        .insert(generations)
        .values({
          pokeApiId: gen.id,
          name: gen.name,
          regionName: gen.main_region.name,
        })
        .onConflictDoUpdate({
          target: generations.pokeApiId,
          set: {
            name: gen.name,
            regionName: gen.main_region.name,
            updatedAt: sql`now()`,
          },
        });
    }

    this.logger.log(`✓ Synced ${list.results.length} generations.`);
  }
}
