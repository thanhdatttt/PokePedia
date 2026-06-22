import { Controller, Post, Query, Get } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { SyncService } from './sync/sync.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('pokemon')
export class PokemonController {
  constructor(
    private readonly pokemonService: PokemonService,
    private readonly syncService: SyncService,
  ) {}

  /**
   * POST /pokemon/sync
   * Kick off a full sync in the background.
   *
   * Query params:
   *   ?limit=20   → dev mode, only fetch first N records per resource
   */
  @Public()
  @Post('sync')
  triggerSync(@Query('limit') limit?: string) {
    if (this.syncService.isRunning()) {
      return { message: 'Sync already in progress.' };
    }

    const options = limit ? { limit: parseInt(limit) } : {};

    // Fire and forget — don't block the HTTP response
    this.syncService.syncAll(options).catch(console.error);

    return {
      message: 'Sync started.',
      mode: limit ? `dev (limit=${limit})` : 'full',
    };
  }

  /**
   * GET /pokemon/sync/status
   * Check whether a sync is currently running.
   */
  @Get('sync/status')
  syncStatus() {
    return { running: this.syncService.isRunning() };
  }
}
