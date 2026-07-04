import Pokedex from 'pokedex-promise-v2';
import { Provider } from '@nestjs/common';
import { POKEDEX_CLIENT } from 'src/common/constants/pokeapi.constant';

export const PokedexClientProvider: Provider = {
  provide: POKEDEX_CLIENT,
  useFactory: () => new Pokedex(),
};