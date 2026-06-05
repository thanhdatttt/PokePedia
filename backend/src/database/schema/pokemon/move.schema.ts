import { pgTable, uuid, integer, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { types } from "./type.schema";
import { pokemonMoves } from "./pokemon-move.schema";
import { evolutionChainNodes } from "./evolution-chain.schema";

export const moves = pgTable('moves', {
  id: uuid('id').defaultRandom().primaryKey(),

  pokeApiId: integer('poke_api_id').notNull().unique(),

  name: varchar('name', {
    length: 100,
  }).notNull().unique(),

  accuracy: integer('accuracy'),

  power: integer('power'),

  pp: integer('pp'),

  priority: integer('priority').notNull().default(0),

  damageClass: varchar('damage_class', {
    length: 50,
  }).notNull(), // "physical" | "special" | "status"

  moveTypeId: uuid('move_type_id')
    .references(() => types.id)
    .notNull(),

  effect: text('effect'),
  flavorText: text('flavor_text'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index('moves_type_idx').on(table.moveTypeId),
]);

export const movesRelations = relations(moves, ({ one, many }) => ({
  moveType: one(types, {
    fields: [moves.moveTypeId],
    references: [types.id],
  }),
  learnedBy: many(pokemonMoves),
  evolutionNodes: many(evolutionChainNodes),
}));