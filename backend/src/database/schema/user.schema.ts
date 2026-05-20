import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';

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
  }),

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