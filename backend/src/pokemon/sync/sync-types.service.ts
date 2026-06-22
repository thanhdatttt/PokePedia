import { Injectable, Inject, Logger } from '@nestjs/common';
import Pokedex from 'pokedex-promise-v2';
import { sql } from 'drizzle-orm';
import { POKEDEX_CLIENT } from '../pokedex.provider';
import { DatabaseService } from '../../database/database.service';
import { types } from '../../database/schema/pokemon';

// PokeAPI does not provide colors — maintained manually.
const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

const FALLBACK_COLOR = '#68A090';

@Injectable()
export class SyncTypesService {
  private readonly logger = new Logger(SyncTypesService.name);

  constructor(
    @Inject(POKEDEX_CLIENT) private readonly pokedex: Pokedex,
    private readonly db: DatabaseService,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Syncing types...');

    const list = await this.pokedex.getTypesList();
    let count = 0;

    for (const item of list.results) {
      const type = await this.pokedex.getTypeByName(item.name);

      // Skip internal/unused types (PokeAPI includes 'unknown' and 'shadow')
      if (type.pokemon.length === 0 && type.id > 10000) continue;

      const color = TYPE_COLORS[type.name] ?? FALLBACK_COLOR;

      await this.db.db
        .insert(types)
        .values({
          pokeApiId: type.id,
          name: type.name,
          color,
        })
        .onConflictDoUpdate({
          target: types.pokeApiId,
          set: {
            name: type.name,
            color,
            updatedAt: sql`now()`,
          },
        });

      count++;
    }

    this.logger.log(`✓ Synced ${count} types.`);
  }
}
