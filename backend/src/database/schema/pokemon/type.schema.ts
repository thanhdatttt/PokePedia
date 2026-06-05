import { pgTable, uuid, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pokemonTypes } from "./pokemon-type.schema";
import { moves } from "./move.schema";

export const types = pgTable('types', {
  id: uuid('id').defaultRandom().primaryKey(),

  pokeApiId: integer('poke_api_id').notNull().unique(),

  name: varchar('name', {
    length: 100,
  }).notNull().unique(),

  color: varchar('color', {
    length: 30,
  }).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const typesRelations = relations(types, ({ many }) => ({
  pokemonTypes: many(pokemonTypes),
  moves: many(moves),
}));