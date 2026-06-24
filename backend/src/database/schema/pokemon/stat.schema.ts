import { pgTable, uuid, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pokemonStats } from "./pokemon-stat.schema";

export const stats = pgTable('stats', {
  id: uuid('id').defaultRandom().primaryKey(),

  pokeApiId: integer('poke_api_id').notNull().unique(),

  name: varchar('name', {
    length: 100,
  }).notNull().unique(),

  // The abbreviated label shown in UI (e.g. "Sp. Atk", "HP")
  shortName: varchar('short_name', {
    length: 20,
  }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const statsRelations = relations(stats, ({ many }) => ({
  pokemonStats: many(pokemonStats),
}));