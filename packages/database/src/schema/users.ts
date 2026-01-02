/**
 * Users schema - Authentication and user management
 */

import { pgTable, serial, text, varchar, timestamp, boolean, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    role: varchar('role', { length: 20 }).notNull().default('user'), // 'user' | 'researcher' | 'admin'
    subscriptionTier: varchar('subscription_tier', { length: 20 }).notNull().default('free'), // 'free' | 'pro' | 'academic'
    preferences: jsonb('preferences').$type<{
        defaultTranslator: number;
        arabicFont: string;
        theme: 'light' | 'dark' | 'auto';
        notifications: boolean;
        language?: string;
    }>().default({
        defaultTranslator: 1,
        arabicFont: 'uthmani',
        theme: 'light',
        notifications: true,
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastLoginAt: timestamp('last_login_at'),
}, (table) => ({
    emailIdx: uniqueIndex('user_email_idx').on(table.email),
    subscriptionIdx: index('user_subscription_idx').on(table.subscriptionTier),
}));

export const sessions = pgTable('sessions', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id),
    token: varchar('token', { length: 255 }).notNull().unique(),
    deviceId: varchar('device_id', { length: 255 }),
    deviceInfo: jsonb('device_info').$type<{
        platform: string;
        browser?: string;
        os?: string;
    }>(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userIdx: index('session_user_idx').on(table.userId),
    tokenIdx: uniqueIndex('session_token_idx').on(table.token),
}));
