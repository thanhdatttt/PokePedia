import { pgTable, uuid, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const abilities = pgTable('abilities', {
  id: uuid('id').defaultRandom().primaryKey(),

  pokeApiId: integer('poke_api_id').notNull().unique(),

  name: varchar('name', {
    length: 100,
  }).notNull().unique(),

  effect: text('effect'),
  flavorText: text('flavor_text'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const abilitiesRelations = relations(abilities, ({ many }) => ({
  pokemonAbilities: many(pokemonAbilities),
}));

import { pokemonAbilities } from "./pokemon-ability.schema";