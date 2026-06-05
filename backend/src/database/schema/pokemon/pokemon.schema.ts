import {
  pgTable, uuid, integer, varchar, text,
  boolean, timestamp, index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { pokemonSpecies } from "./pokemon-species.schema";
import { pokemonTypes }     from "./pokemon-type.schema";
import { pokemonStats }     from "./pokemon-stat.schema";
import { pokemonAbilities } from "./pokemon-ability.schema";
import { pokemonMoves }     from "./pokemon-move.schema";

export const pokemon = pgTable('pokemon', {
  id: uuid('id').defaultRandom().primaryKey(),

  pokeApiId: integer('poke_api_id').notNull().unique(),

  speciesId: uuid('species_id')
    .references(() => pokemonSpecies.id, { onDelete: 'cascade' })
    .notNull(),

  formName: varchar('form_name', {
    length: 100,
  }),

  // URL-safe identifier: "charizard", "charizard-mega-x"
  slug: varchar('slug', {
    length: 100,
  }).notNull().unique(),

  // Form-level data (CAN differ between forms)
  height: integer('height').notNull(),   // in decimetres
  weight: integer('weight').notNull(),   // in hectograms

  baseExperience: integer('base_experience'),

  isDefault: boolean('is_default').default(true).notNull(),
  isMega: boolean('is_mega').default(false).notNull(),
  isGmax: boolean('is_gmax').default(false).notNull(),

  spriteUrl: text('sprite_url'),
  shinySpriteUrl: text('shiny_sprite_url'),
  officialArtUrl: text('official_art_url'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index('pokemon_species_idx').on(table.speciesId),
  index('pokemon_default_form_idx').on(table.speciesId, table.isDefault),
]);

export const pokemonRelations = relations(pokemon, ({ one, many }) => ({
  species: one(pokemonSpecies, {
    fields: [pokemon.speciesId],
    references: [pokemonSpecies.id],
  }),
  types:     many(pokemonTypes),
  stats:     many(pokemonStats),
  abilities: many(pokemonAbilities),
  moves:     many(pokemonMoves),
}));