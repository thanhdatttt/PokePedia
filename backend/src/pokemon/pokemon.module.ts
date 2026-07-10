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

@Module({
  controllers: [PokemonController],
  providers: [
    PokemonService,
    PokemonMoveService,
    PokedexClientProvider,
    SyncService,
    SyncGenerationsService,
    SyncTypesService,
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
