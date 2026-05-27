import { pgTable, uuid, varchar, timestamp,pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// enums
export const UserRole = pgEnum('user_role', ['USER', 'ADMIN']);

// tables
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),

  username: varchar('username', {
    length: 50,
  }).notNull().unique(),

  email: varchar('email', {
    length: 255,
  }).notNull().unique(),

  passwordHash: varchar('password_hash', {
    length: 255,
  }).notNull(),

  avatarUrl: varchar('avatar_url', {
    length: 500,
  }),

  role: UserRole('role').default('USER').notNull(),

  createdAt: timestamp('created_at')
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  tokenHash: varchar('token_hash', {
    length: 500,
  }).notNull(),

  createdAt: timestamp('created_at')
    .defaultNow()
    .notNull(),

  expiresAt: timestamp('expires_at').notNull(),
});

// relations
export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));