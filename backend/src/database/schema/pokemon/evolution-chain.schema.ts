import {
  pgTable, uuid, integer, smallint, boolean,
  varchar, timestamp, index,
} from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pokemonSpecies } from "./pokemon-species.schema";
import { items } from "./item.schema";
import { moves } from "./move.schema";

// Evolution Trigger Enum
export const evolutionTriggerEnum = pgEnum('evolution_trigger', [
  'level_up',   // Reaches a certain level (may have extra conditions)
  'use_item',   // Player uses an item directly on the Pokémon (e.g. Fire Stone)
  'trade',      // Traded, optionally while holding a specific item
  'shed',       // Shedinja — appears in an empty party slot when Nincada evolves
  'other',      // Catch-all for unique mechanics (e.g. Kubfu dojo)
]);

// EVOLUTION CHAINS
//
// An evolution chain is just a container that groups a family together.
// Bulbasaur, Ivysaur, and Venusaur all belong to chain #1.
// Eevee and all 8 Eeveelutions belong to chain #67.
//
// The actual tree structure lives in evolution_chain_nodes.
// This table exists so you can do: "give me the full family for Eevee" by
// joining species → chain → all nodes in that chain.
export const evolutionChains = pgTable('evolution_chains', {
  id: uuid('id').defaultRandom().primaryKey(),

  pokeApiId: integer('poke_api_id').notNull().unique(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// EVOLUTION CHAIN NODES
//
// Each row = one species in the chain, plus the conditions required to reach
// it from its parent.
//
// The tree is stored as an adjacency list:
//   parentNodeId = null  → root node (e.g. Bulbasaur, Eevee, Tyrogue)
//   parentNodeId = X     → this species evolves FROM the species at node X
//
// Example — Eevee's chain:
//
//   Node 1: speciesId=Eevee,     parentNodeId=null      (root)
//   Node 2: speciesId=Vaporeon,  parentNodeId=Node1,  trigger=use_item, itemId=WaterStone
//   Node 3: speciesId=Jolteon,   parentNodeId=Node1,  trigger=use_item, itemId=ThunderStone
//   Node 4: speciesId=Flareon,   parentNodeId=Node1,  trigger=use_item, itemId=FireStone
//   Node 5: speciesId=Espeon,    parentNodeId=Node1,  trigger=level_up, minHappiness=220, timeOfDay='day'
//   ... etc.
//
// Example — linear chain (Bulbasaur):
//
//   Node 1: speciesId=Bulbasaur,  parentNodeId=null,   (root)
//   Node 2: speciesId=Ivysaur,    parentNodeId=Node1,  trigger=level_up, minLevel=16
//   Node 3: speciesId=Venusaur,   parentNodeId=Node2,  trigger=level_up, minLevel=32
//
// ─── Condition columns ────────────────────────────────────────────────────────
// Only the columns relevant to a given evolution are filled in.
// All condition columns are nullable — a null value means "no requirement".
//
// This is intentionally denormalized (vs a separate evolution_conditions table)
// because:
//   1. The number of condition types is finite and well-known from PokéAPI.
//   2. A separate table would require 6–8 joins to reconstruct one node's
//      conditions, making the common "render the evolution chain" query painful.
//   3. The row is still fully normalized — each column has one clear meaning.
export const evolutionChainNodes = pgTable('evolution_chain_nodes', {
  id: uuid('id').defaultRandom().primaryKey(),

  chainId: uuid('chain_id')
    .references(() => evolutionChains.id, { onDelete: 'cascade' })
    .notNull(),

  // The species this node represents
  speciesId: uuid('species_id')
    .references(() => pokemonSpecies.id, { onDelete: 'cascade' })
    .notNull(),

  // null = this is the root (baby/base stage) of the chain
  parentNodeId: uuid('parent_node_id'),
  // NOTE: the self-referencing FK is added below via .references() workaround;
  // Drizzle does not support inline self-references, so we declare it separately.

  // ── Trigger ────────────────────────────────────────────────────────────────
  // null only on the root node (no trigger needed to "be" Bulbasaur)
  trigger: evolutionTriggerEnum('trigger'),

  // ── Level-up conditions ────────────────────────────────────────────────────
  minLevel: smallint('min_level'),               // Metapod → Butterfree at 10

  // ── Item conditions ────────────────────────────────────────────────────────
  // Item used ON the Pokémon (use_item trigger) OR held during trade
  itemId: uuid('item_id'),                       // FK declared below
  heldItemId: uuid('held_item_id'),              // FK declared below

  // ── Friendship / affection ────────────────────────────────────────────────
  minHappiness: smallint('min_happiness'),       // Togepi → Togetic at 220
  minAffection: smallint('min_affection'),       // Eevee → Sylveon (Gen VI)
  minBeauty: smallint('min_beauty'),             // Feebas → Milotic (Gen III)

  // ── Time of day ───────────────────────────────────────────────────────────
  // 'day' | 'night' | null
  timeOfDay: varchar('time_of_day', { length: 10 }),

  // ── Known move / move type ────────────────────────────────────────────────
  // Mime Jr. → Mr. Mime requires knowing a Fairy-type move
  knownMoveId: uuid('known_move_id'),            // FK declared below
  knownMoveType: varchar('known_move_type', { length: 30 }),

  // ── Party / overworld conditions ──────────────────────────────────────────
  partySpeciesId: uuid('party_species_id'),      // Must have species X in party (Mantyke→Mantine)
  partyTypeRequired: varchar('party_type_required', { length: 30 }), // Must have type X in party

  // ── Stat-based conditions ─────────────────────────────────────────────────
  // Tyrogue evolves into Hitmonlee / Hitmonchan / Hitmontop based on stat comparison
  // -1 = Attack < Defense, 0 = Attack = Defense, 1 = Attack > Defense
  relativePhysicalStats: smallint('relative_physical_stats'),

  // ── Gender requirement ────────────────────────────────────────────────────
  // 'male' | 'female' | null — Burmy♂→Mothim, Burmy♀→Wormadam
  genderRequired: varchar('gender_required', { length: 10 }),

  // ── Location / region ─────────────────────────────────────────────────────
  locationRequired: varchar('location_required', { length: 100 }), // Leafeon / Glaceon in Gen IV

  // ── Special flags ─────────────────────────────────────────────────────────
  needsRain: boolean('needs_rain').default(false).notNull(),         // Goodra line
  turnUpsideDown: boolean('turn_upside_down').default(false).notNull(), // Inkay → Malamar
  isNightShade: boolean('is_night_shade').default(false).notNull(),  // Galarian Yamask

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),

}, (t) => [
  // "Give me all nodes in chain X" — the most common query (render full family)
  index('evo_nodes_chain_idx').on(t.chainId),
  // "Which chain does Eevee belong to?" — needed on species lookup page
  index('evo_nodes_species_idx').on(t.speciesId),
  // "What evolves from Eevee?" — traversing the tree downward
  index('evo_nodes_parent_idx').on(t.parentNodeId),
]);

// ─── Self-referencing FK workaround ──────────────────────────────────────────
// Drizzle doesn't support inline self-references. We declare the FK via a
// separate helper that your migration tool will pick up, or handle in raw SQL.
//
// In your migration (or initial seed SQL), add:
//   ALTER TABLE evolution_chain_nodes
//     ADD CONSTRAINT evo_nodes_parent_fk
//     FOREIGN KEY (parent_node_id) REFERENCES evolution_chain_nodes(id)
//     ON DELETE SET NULL;
//
// SET NULL on delete: if a parent node is removed, children become orphaned
// roots rather than being cascade-deleted — safer for data integrity.

// Relations
export const evolutionChainsRelations = relations(evolutionChains, ({ many }) => ({
  nodes: many(evolutionChainNodes),
}));

export const evolutionChainNodesRelations = relations(evolutionChainNodes, ({ one, many }) => ({
  chain: one(evolutionChains, {
    fields: [evolutionChainNodes.chainId],
    references: [evolutionChains.id],
  }),
  species: one(pokemonSpecies, {
    fields: [evolutionChainNodes.speciesId],
    references: [pokemonSpecies.id],
  }),
  // Self-join: the parent node in the tree
  parent: one(evolutionChainNodes, {
    fields: [evolutionChainNodes.parentNodeId],
    references: [evolutionChainNodes.id],
    relationName: 'node_children',
  }),
  // Self-join: all child nodes (what this species evolves into)
  children: many(evolutionChainNodes, {
    relationName: 'node_children',
  }),
  // Condition FKs
  item:         one(items, { fields: [evolutionChainNodes.itemId],       references: [items.id], relationName: 'use_item' }),
  heldItem:     one(items, { fields: [evolutionChainNodes.heldItemId],   references: [items.id], relationName: 'held_item' }),
  knownMove:    one(moves, { fields: [evolutionChainNodes.knownMoveId],  references: [moves.id] }),
  partySpecies: one(pokemonSpecies, {
    fields: [evolutionChainNodes.partySpeciesId],
    references: [pokemonSpecies.id],
    relationName: 'party_species',
  }),
}));