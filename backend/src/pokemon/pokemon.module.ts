import { Module } from '@nestjs/common';
import { PokemonController } from './pokemon.controller';
import { PokemonService } from './pokemon/pokemon.service';
import { PokemonMoveService } from './pokemon/pokemonMove.service';
import { SyncService } from './sync/sync.service';
import { SyncGenerationsService } from './sync/sync-generations.service';
import { SyncTypesService } from './sync/sync-types.service';
import { SyncStatsService } from './sync/sync-stats.service';
import { SyncAbilitiesService } from './sync/sync-abilities.service';
import { SyncItemsService } from './sync/sync-items.service';
import { SyncSpeciesService } from './sync/sync-species.service';
import { SyncPokemonService } from './sync/sync-pokemon.service';
import { PokedexClientProvider } from './pokedex.provider';
import { SyncMovesService } from './sync/sync-moves.service';
import { SyncPokemonMovesService } from './sync/sync-pokemon-moves.service';
import { SyncTypeRelationsService } from './sync/sync-type-relation.service';
import { TypeController } from './type/type.controller';
import { TypeService } from './type/type.service';

@Module({
  controllers: [PokemonController, TypeController],
  providers: [
    PokemonService,
    PokemonMoveService,
    PokedexClientProvider,
    TypeService,
    SyncService,
    SyncGenerationsService,
    SyncTypesService,
    SyncTypeRelationsService,
    SyncStatsService,
    SyncAbilitiesService,
    SyncMovesService,
    SyncPokemonMovesService,
    SyncItemsService,
    SyncSpeciesService,
    SyncPokemonService,
  ],
})
export class PokemonModule { }
