import Pokedex from 'pokedex-promise-v2';

export const POKEDEX_CLIENT = 'POKEDEX-CLIENT';
export const pokedexProvider = {
  provide: POKEDEX_CLIENT,
  useFactory: () => {
    return new Pokedex({
      cacheLimit: 10000,
      timeout: 30000,
    });
  },
}