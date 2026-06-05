import { pgTable, uuid, primaryKey, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pokemon } from "./pokemon.schema";
import { stats } from "./stat.schema";

export const pokemonStats = pgTable('pokemon_stats', {
  pokemonId: uuid('pokemon_id')
    .references(() => pokemon.id, { onDelete: 'cascade' })
    .notNull(),

  statId: uuid('stat_id')
    .references(() => stats.id, { onDelete: 'cascade' })
    .notNull(),

  baseValue: integer('base_value').notNull(),

  effort: integer('effort').default(0).notNull(),
}, (t) => [
  primaryKey({ columns: [t.pokemonId, t.statId] }),
]);

export const pokemonStatsRelations = relations(pokemonStats, ({ one }) => ({
  pokemon: one(pokemon, {
    fields: [pokemonStats.pokemonId],
    references: [pokemon.id],
  }),
  stat: one(stats, {
    fields: [pokemonStats.statId],
    references: [stats.id],
  }),
}));