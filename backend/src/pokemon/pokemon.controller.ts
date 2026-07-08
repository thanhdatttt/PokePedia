import { Controller, Post, Query, Get, Param } from '@nestjs/common';
import { PokemonService } from './pokemon/pokemon.service';
import { SyncService } from './sync/sync.service';
import { Public } from 'src/common/decorators/public.decorator';
import { SyncPokemonQueryDto } from './dtos/syncQuery.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { PokemonQueryDto } from './dtos/pokemonQuery.dto';
import { PokemonMovesQueryDto } from './dtos/pokemonMoveQuery.dto';
import { PokemonMoveService } from './pokemon/pokemonMove.service';

@Controller('pokemon')
export class PokemonController {
  constructor(
    private readonly pokemonMoveService: PokemonMoveService,
    private readonly pokemonService: PokemonService,
    private readonly syncService: SyncService,
  ) { }

  // list
  @Public()
  @Get()
  @ResponseMessage('Pokemon list retrieved successfully')
  findAll(@Query() query: PokemonQueryDto) {
    return this.pokemonService.getAll(query);
  }

  // detail
  @Public()
  @Get(':idOrSlug')
  @ResponseMessage('Pokemon detail retrieved successfully')
  getDetail(@Param('idOrSlug') idOrSlug: string) {
    return this.pokemonService.getDetail(idOrSlug);
  }

  // move list
  @Public()
  @Get(':idOrSlug/moves')
  @ResponseMessage('Pokemon moves retrieved successfully')
  findMoves(
    @Param('idOrSlug') idOrSlug: string,
    @Query() query: PokemonMovesQueryDto,
  ) {
    return this.pokemonMoveService.getMoves(idOrSlug, query);
  }

  // sync data
  @Public()
  @Post('sync')
  triggerSync(@Query() query: SyncPokemonQueryDto) {
    if (this.syncService.isRunning()) {
      return { message: 'Sync already in progress.' };
    }

    const options = query.limit ? { limit: query.limit } : {};

    // Fire and forget — don't block the HTTP response
    this.syncService.syncAll(options).catch(console.error);

    return {
      message: 'Sync started.',
      mode: query.limit ? `dev (limit=${query.limit})` : 'full',
    };
  }

  // sync status
  @Get('sync/status')
  syncStatus() {
    return { running: this.syncService.isRunning() };
  }
}
