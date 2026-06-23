import Pokedex from 'pokedex-promise-v2';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { POKEDEX_CLIENT, BATCH_SIZE } from 'src/common/constants/pokeapi.constant';
import { sql } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { items } from '../../database/schema/pokemon';

// Maps PokeAPI item category slugs → itemCategoryEnum values.
// PokeAPI has ~50 sub-categories -> fold them into 9 enum values.
const CATEGORY_MAP: Record<string, string> = {
  // Pokéballs
  'standard-balls': 'pokeball',
  'special-balls': 'pokeball',
  'apricorn-balls': 'pokeball',
  'sport-balls': 'pokeball',
  // Medicine
  'healing': 'medicine',
  'pp-recovery': 'medicine',
  'revival': 'medicine',
  'status-cures': 'medicine',
  'vitamins': 'medicine',
  'picky-healing': 'medicine',
  'type-protection': 'medicine',
  // Evolution stones
  'evolution-stones': 'evolution_stone',
  // Held items
  'held-items': 'held_item',
  'choice': 'held_item',
  'effort-training': 'held_item',
  'bad-held-items': 'held_item',
  'training': 'held_item',
  'species-specific': 'held_item',
  'type-enhancement': 'held_item',
  'jewels': 'held_item',
  'mega-stones': 'held_item',
  'z-crystals': 'held_item',
  // Battle items
  'battle-items': 'battle_item',
  'flutes': 'battle_item',
  // Berries
  'berries': 'berry',
  'baking-only': 'berry',
  'effort-drop': 'berry',
  'medicine': 'berry',
  'other': 'berry',
  'in-a-pinch': 'berry',
  'baked-goods': 'berry',
  // Key items
  'gameplay': 'key_item',
  'plot-advancement': 'key_item',
  'collectibles': 'key_item',
  'loot': 'key_item',
  'all-machines': 'key_item',
  // TM / HM / TR
  'all-mail': 'machine',
  'machines': 'machine',
  // Other
  'mulch': 'other',
  'dex-completion': 'other',
  'fossils': 'other',
  'apricorn-box': 'other',
  'data-cards': 'other',
  'scarves': 'other',
  'miracle-shooter': 'other',
  'plates': 'other',
  'memories': 'other',
  'incense': 'other',
  'curry-ingredients': 'other',
  'sandwiches': 'other',
};

@Injectable()
export class SyncItemsService {
  private readonly logger = new Logger(SyncItemsService.name);

  constructor(
    @Inject(POKEDEX_CLIENT) private readonly pokedex: Pokedex,
    private readonly db: DatabaseService,
  ) {}

  async run(limit?: number): Promise<void> {
    this.logger.log('Syncing items...');

    const list = await this.pokedex.getItemsList({ limit: limit ?? 2200 });
    const results = list.results;
    let synced = 0;

    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const chunk = results.slice(i, i + BATCH_SIZE);

      const counts = await Promise.all(
        chunk.map((item) => this.syncOne(item.name)),
      );
      synced += counts.filter(Boolean).length;

      this.logger.log(
        `  items: ${Math.min(i + BATCH_SIZE, results.length)}/${results.length}`,
      );
    }

    this.logger.log(`✓ Synced ${synced} items (skipped internals).`);
  }

  private async syncOne(name: string): Promise<boolean> {
    const item = await this.pokedex.getItemByName(name);

    // Skip internal items (id > 10000 are game-internal, not player-facing)
    if (item.id > 10000) return false;

    const category = this.mapCategory(item.category.name);

    const effect =
      item.effect_entries.find((e) => e.language.name === 'en')
        ?.short_effect ?? null;

    const flavorText =
      item.flavor_text_entries.find((e) => e.language.name === 'en')
        ?.text ?? null;

    const spriteUrl = item.sprites?.default ?? null;

    await this.db.db
      .insert(items)
      .values({
        pokeApiId: item.id,
        name: item.name,
        slug: item.name, // PokeAPI names are already URL-safe slugs
        category,
        effect,
        flavorText,
        cost: item.cost ?? null,
        spriteUrl,
      })
      .onConflictDoUpdate({
        target: items.pokeApiId,
        set: {
          name: item.name,
          category,
          effect,
          flavorText,
          cost: item.cost ?? null,
          spriteUrl,
          updatedAt: sql`now()`,
        },
      });

    return true;
  }

  private mapCategory(pokeApiCategory: string): typeof items.$inferInsert['category'] {
    return (CATEGORY_MAP[pokeApiCategory] ?? 'other') as typeof items.$inferInsert['category'];
  }
}
