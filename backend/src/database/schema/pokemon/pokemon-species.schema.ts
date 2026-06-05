import { pgTable, uuid, integer, varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { generations } from "./generation.schema";
import { pokemon } from "./pokemon.schema";

export const pokemonSpecies = pgTable('pokemon_species', {
  id: uuid('id').defaultRandom().primaryKey(),

  pokeApiId: integer('poke_api_id').notNull().unique(),

  name: varchar('name', {
    length: 100,
  }).notNull().unique(),

  slug: varchar('slug', {
    length: 100,
  }).notNull().unique(),

  // Species-level flags — same for all forms of Bulbasaur
  isLegendary: boolean('is_legendary').default(false).notNull(),
  isMythical: boolean('is_mythical').default(false).notNull(),
  isBaby: boolean('is_baby').default(false).notNull(),

  captureRate: integer('capture_rate'),

  // -1 = genderless, 0 = male only, 8 = female only, values 1–7 = ratio
  genderRate: integer('gender_rate'),

  hatchCounter: integer('hatch_counter'),

  baseHappiness: integer('base_happiness').default(70),

  generationId: uuid('generation_id')
    .references(() => generations.id)
    .notNull(),

  flavorText: text('flavor_text'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index('species_generation_idx').on(table.generationId),
  index('species_legendary_idx').on(table.isLegendary),
  index('species_mythical_idx').on(table.isMythical),
]
);

export const pokemonSpeciesRelations = relations(pokemonSpecies, ({ one, many }) => ({
  generation: one(generations, {
    fields: [pokemonSpecies.generationId],
    references: [generations.id],
  }),
  // One species has many forms (default + mega + gmax etc.)
  forms: many(pokemon),
}));