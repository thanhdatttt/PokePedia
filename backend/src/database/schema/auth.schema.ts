import { pgTable, uuid, varchar, timestamp,pgEnum } from 'drizzle-orm/pg-core';

// enums
export const OtpType = pgEnum('otp_type', ['RESET', 'REGISTER']);

// tables
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),

  userId: uuid('user_id').notNull(),

  tokenHash: varchar('token_hash', {
    length: 500,
  }).notNull(),

  createdAt: timestamp('created_at')
    .defaultNow()
    .notNull(),

  expiresAt: timestamp('expires_at').notNull(),
});

export const otps = pgTable('otps', {
  id: uuid('id').defaultRandom().primaryKey(),

  email: varchar('email', {
    length: 255,
  }).notNull(),

  otpType: OtpType('type').notNull(),

  otpHash: varchar('otp_hash', {
    length: 500,
  }).notNull(),

  createdAt: timestamp('created_at')
    .defaultNow()
    .notNull(),

  expiresAt: timestamp('expires_at').notNull(),
});