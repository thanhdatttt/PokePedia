import { pgTable, uuid, primaryKey, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pokemon } from "./pokemon.schema";
import { types } from "./type.schema";

export const pokemonTypes = pgTable('pokemon_types', {
  pokemonId: uuid('pokemon_id')
    .references(() => pokemon.id, { onDelete: 'cascade' })
    .notNull(),

  typeId: uuid('type_id')
    .references(() => types.id, { onDelete: 'cascade' })
    .notNull(),

  slot: integer('slot').notNull(), // 1 = primary, 2 = secondary
}, (t) => [
  primaryKey({ columns: [t.pokemonId, t.typeId] }),
  index('pokemon_types_type_idx').on(t.typeId),
]);

export const pokemonTypesRelations = relations(pokemonTypes, ({ one }) => ({
  pokemon: one(pokemon, {
    fields: [pokemonTypes.pokemonId],
    references: [pokemon.id],
  }),
  type: one(types, {
    fields: [pokemonTypes.typeId],
    references: [types.id],
  }),
}));