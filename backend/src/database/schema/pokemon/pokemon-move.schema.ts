import {
  pgTable, uuid, integer, smallint,
  primaryKey, index,
} from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pokemon } from "./pokemon.schema";
import { moves } from "./move.schema";

// Learn Method Enum
export const learnMethodEnum = pgEnum('learn_method', [
  'level_up',
  'machine',
  'egg',
  'tutor',
  'transfer',
  'reminder',
]);

export const pokemonMoves = pgTable('pokemon_moves', {
  pokemonId: uuid('pokemon_id')
    .references(() => pokemon.id, { onDelete: 'cascade' })
    .notNull(),

  moveId: uuid('move_id')
    .references(() => moves.id, { onDelete: 'cascade' })
    .notNull(),

  learnMethod: learnMethodEnum('learn_method').notNull(),

  // Which game version this learnset entry applies to (PokéAPI version-group ID).
  versionGroupId: integer('version_group_id').notNull(),

  // Only populated when learnMethod = 'level_up'. Null for machine / egg / tutor.
  levelLearnedAt: smallint('level_learned_at'),

}, (t) => [
  primaryKey({ columns: [t.pokemonId, t.moveId, t.learnMethod, t.versionGroupId] }),

  // Supporting indexes
  index('pokemon_moves_move_idx').on(t.moveId),
  index('pokemon_moves_method_idx').on(t.moveId, t.learnMethod),
]);

export const pokemonMovesRelations = relations(pokemonMoves, ({ one }) => ({
  pokemon: one(pokemon, {
    fields: [pokemonMoves.pokemonId],
    references: [pokemon.id],
  }),
  move: one(moves, {
    fields: [pokemonMoves.moveId],
    references: [moves.id],
  }),
}));