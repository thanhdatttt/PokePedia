import { Controller, Post, Query, Get, Param } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { SyncService } from './sync/sync.service';
import { Public } from 'src/common/decorators/public.decorator';
import { SyncPokemonQueryDto } from './dtos/syncQuery.dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { PokemonQueryDto } from './dtos/pokemonQuery.dto';

@Controller('pokemon')
export class PokemonController {
  constructor(
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
