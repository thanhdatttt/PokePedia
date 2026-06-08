import { Module } from '@nestjs/common';
import { PokeapiService } from './pokeapi.service';
import { PokeapiController } from './pokeapi.controller';

@Module({
  controllers: [PokeapiController],
  providers: [PokeapiService],
})
export class PokeapiModule {}
