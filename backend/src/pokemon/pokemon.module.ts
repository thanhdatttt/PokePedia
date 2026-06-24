import { Module } from '@nestjs/common';
import { PokemonController } from './pokemon.controller';
import { PokemonService } from './pokemon.service';
import { SyncService } from './sync/sync.service';
import { SyncGenerationsService } from './sync/sync-generations.service';
import { SyncTypesService } from './sync/sync-types.service';
import { SyncStatsService } from './sync/sync-stats.service';
import { SyncAbilitiesService } from './sync/sync-abilities.service';
import { SyncItemsService } from './sync/sync-items.service';
import { SyncSpeciesService } from './sync/sync-species.service';
import { SyncPokemonService } from './sync/sync-pokemon.service';

@Module({
  controllers: [PokemonController],
  providers: [
    PokemonService,
    SyncService,
    SyncGenerationsService,
    SyncTypesService,
    SyncStatsService,
    SyncAbilitiesService,
    SyncItemsService,
    SyncSpeciesService,
    SyncPokemonService,
  ],
})
export class PokemonModule {}
