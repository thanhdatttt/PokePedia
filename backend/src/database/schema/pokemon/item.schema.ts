import { pgTable, uuid, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { evolutionChainNodes } from "./evolution-chain.schema";

export const itemCategoryEnum = pgEnum('item_category', [
  'pokeball',
  'medicine',
  'held_item',
  'evolution_stone',
  'battle_item',
  'berry',
  'key_item',
  'machine',   // TM / TR / HM
  'other',
]);

export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),

  pokeApiId: integer('poke_api_id').notNull().unique(),

  name: varchar('name', { length: 100 }).notNull().unique(),

  slug: varchar('slug', { length: 100 }).notNull().unique(),

  category: itemCategoryEnum('category').notNull(),

  effect: text('effect'),
  flavorText: text('flavor_text'),

  // null = not sold in any shop
  cost: integer('cost'),

  spriteUrl: text('sprite_url'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const itemsRelations = relations(items, ({ many }) => ({
  evolutionNodesAsUseItem:  many(evolutionChainNodes, { relationName: 'use_item' }),
  evolutionNodesAsHeldItem: many(evolutionChainNodes, { relationName: 'held_item' }),
}));