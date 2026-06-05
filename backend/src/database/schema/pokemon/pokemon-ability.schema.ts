import { pgTable, uuid, primaryKey, integer, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pokemon } from "./pokemon.schema";
import { abilities } from "./ability.schema";

export const pokemonAbilities = pgTable('pokemon_abilities', {
  pokemonId: uuid('pokemon_id')
    .references(() => pokemon.id, { onDelete: 'cascade' })
    .notNull(),

  abilityId: uuid('ability_id')
    .references(() => abilities.id, { onDelete: 'cascade' })
    .notNull(),

  isHidden: boolean('is_hidden').default(false).notNull(),

  slot: integer('slot').notNull(), // 1, 2 = regular; 3 = hidden
}, (t) => [
  primaryKey({ columns: [t.pokemonId, t.abilityId] }),
  index('pokemon_abilities_ability_idx').on(t.abilityId),
]);

export const pokemonAbilitiesRelations = relations(pokemonAbilities, ({ one }) => ({
  pokemon: one(pokemon, {
    fields: [pokemonAbilities.pokemonId],
    references: [pokemon.id],
  }),
  ability: one(abilities, {
    fields: [pokemonAbilities.abilityId],
    references: [abilities.id],
  }),
}));