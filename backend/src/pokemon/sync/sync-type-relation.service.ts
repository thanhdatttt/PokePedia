import { Injectable, Inject, Logger } from '@nestjs/common';
import Pokedex from 'pokedex-promise-v2';
import { POKEDEX_CLIENT } from 'src/common/constants/pokeapi.constant';
import { DatabaseService } from '../../database/database.service';
import { types, typeRelations } from '../../database/schema/pokemon';


@Injectable()
export class SyncTypeRelationsService {
  private readonly logger = new Logger(SyncTypeRelationsService.name);

  constructor(
    @Inject(POKEDEX_CLIENT) private readonly pokedex: Pokedex,
    private readonly db: DatabaseService,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Syncing type effectiveness chart...');

    // Types must already be synced — build a pokeApiName -> our uuid map
    const dbTypes = await this.db.db.select().from(types);
    const idByName = new Map(dbTypes.map((t) => [t.name, t.id]));

    let count = 0;

    for (const attackingType of dbTypes) {
      const detail = await this.pokedex.getTypeByName(attackingType.name);
      const relations = detail.damage_relations;

      // Only keep exceptions to the default 1x multiplier
      const exceptions: { defendingName: string; multiplier: number }[] = [
        ...relations.double_damage_to.map((t) => ({ defendingName: t.name, multiplier: 2 })),
        ...relations.half_damage_to.map((t) => ({ defendingName: t.name, multiplier: 0.5 })),
        ...relations.no_damage_to.map((t) => ({ defendingName: t.name, multiplier: 0 })),
      ];

      for (const { defendingName, multiplier } of exceptions) {
        const defendingTypeId = idByName.get(defendingName);
        // Skip types we don't track (e.g. 'unknown', 'shadow')
        if (!defendingTypeId) continue;

        await this.db.db
          .insert(typeRelations)
          .values({
            attackingTypeId: attackingType.id,
            defendingTypeId,
            multiplier,
          })
          .onConflictDoUpdate({
            target: [typeRelations.attackingTypeId, typeRelations.defendingTypeId],
            set: { multiplier },
          });

        count++;
      }
    }

    this.logger.log(`✓ Synced ${count} type relations.`);
  }
}
