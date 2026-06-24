import { pgTable, uuid, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pokemonSpecies } from "./pokemon-species.schema";

export const generations = pgTable('generations', {
  id: uuid('id').defaultRandom().primaryKey(),

  pokeApiId: integer('poke_api_id').notNull().unique(),

  name: varchar('name', {
    length: 100,
  }).notNull().unique(),

  regionName: varchar('region_name', {
    length: 100,
  }).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const generationsRelations = relations(generations, ({ many }) => ({
  species: many(pokemonSpecies),
}));