import { pgTable, uuid, real, primaryKey, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { types } from "./type.schema";

export const typeRelations = pgTable('type_relations', {
  attackingTypeId: uuid('attacking_type_id')
    .references(() => types.id, { onDelete: 'cascade' })
    .notNull(),

  defendingTypeId: uuid('defending_type_id')
    .references(() => types.id, { onDelete: 'cascade' })
    .notNull(),

  // 0 = no effect, 0.5 = not very effective, 2 = super effective
  multiplier: real('multiplier').notNull(),
}, (t) => [
  primaryKey({ columns: [t.attackingTypeId, t.defendingTypeId] }),
  index('type_relations_defending_idx').on(t.defendingTypeId),
]);

export const typeRelationsRelations = relations(typeRelations, ({ one }) => ({
  attackingType: one(types, {
    fields: [typeRelations.attackingTypeId],
    references: [types.id],
    relationName: 'attacking',
  }),
  defendingType: one(types, {
    fields: [typeRelations.defendingTypeId],
    references: [types.id],
    relationName: 'defending',
  }),
}));
