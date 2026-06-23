import Pokedex from 'pokedex-promise-v2';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { POKEDEX_CLIENT, BATCH_SIZE } from 'src/common/constants/pokeapi.constant';
import { DatabaseService } from '../../database/database.service';
import { abilities } from '../../database/schema/pokemon';

@Injectable()
export class SyncAbilitiesService {
  private readonly logger = new Logger(SyncAbilitiesService.name);

  constructor(
    @Inject(POKEDEX_CLIENT) 
    private readonly pokedex: Pokedex,
    private readonly db: DatabaseService,
  ) {}

  async run(limit?: number): Promise<void> {
    this.logger.log('Syncing abilities...');

    const list = await this.pokedex.getAbilitiesList({ limit: limit ?? 400 });
    const results = list.results;

    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const chunk = results.slice(i, i + BATCH_SIZE);

      await Promise.all(
        chunk.map((item) => this.syncOne(item.name)),
      );

      this.logger.log(
        `  abilities: ${Math.min(i + BATCH_SIZE, results.length)}/${results.length}`,
      );
    }

    this.logger.log(`✓ Synced ${results.length} abilities.`);
  }

  private async syncOne(name: string): Promise<void> {
    const ability = await this.pokedex.getAbilityByName(name);

    // Skip non-standard abilities (pokeApiId > 10000 are internal)
    if (ability.id > 10000) return;

    const effect =
      ability.effect_entries.find((e) => e.language.name === 'en')
        ?.short_effect ?? null;

    const flavorText =
      ability.flavor_text_entries.find((e) => e.language.name === 'en')
        ?.flavor_text ?? null;

    await this.db.db
      .insert(abilities)
      .values({
        pokeApiId: ability.id,
        name: ability.name,
        effect,
        flavorText,
      })
      .onConflictDoUpdate({
        target: abilities.pokeApiId,
        set: {
          name: ability.name,
          effect,
          flavorText,
          updatedAt: sql`now()`,
        },
      });
  }
}
