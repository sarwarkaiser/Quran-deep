/**
 * Research schema - Projects, annotations, bookmarks
 */

import { pgTable, serial, integer, varchar, text, boolean, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';
import { ayahs } from './quran';

export const researchProjects = pgTable('research_projects', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    isPublic: boolean('is_public').default(false),
    collaborators: jsonb('collaborators').$type<number[]>().default([]),
    tags: jsonb('tags').$type<string[]>().default([]),
    metadata: jsonb('metadata').$type<{
        methodology?: string;
        objectives?: string[];
        status: 'draft' | 'active' | 'completed';
    }>().default({ status: 'draft' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    userIdx: index('project_user_idx').on(table.userId),
    publicIdx: index('project_public_idx').on(table.isPublic),
}));

export const annotations = pgTable('annotations', {
    id: serial('id').primaryKey(),
    projectId: integer('project_id').notNull().references(() => researchProjects.id, { onDelete: 'cascade' }),
    ayahId: integer('ayah_id').notNull().references(() => ayahs.id),
    userId: integer('user_id').notNull().references(() => users.id),
    noteText: text('note_text').notNull(),
    noteHtml: text('note_html'),
    highlightedText: text('highlighted_text'),
    highlightColor: varchar('highlight_color', { length: 20 }),
    tags: jsonb('tags').$type<string[]>().default([]),
    citations: jsonb('citations').$type<Array<{
        type: string;
        title: string;
        author?: string;
        year?: number;
        url?: string;
    }>>().default([]),
    isPrivate: boolean('is_private').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    projectIdx: index('annotation_project_idx').on(table.projectId),
    ayahIdx: index('annotation_ayah_idx').on(table.ayahId),
    userIdx: index('annotation_user_idx').on(table.userId),
}));

export const bookmarks = pgTable('bookmarks', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id),
    ayahId: integer('ayah_id').notNull().references(() => ayahs.id),
    category: varchar('category', { length: 100 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userAyahIdx: uniqueIndex('bookmark_user_ayah_idx').on(table.userId, table.ayahId),
    userCategoryIdx: index('bookmark_user_category_idx').on(table.userId, table.category),
}));

export const readingProgress = pgTable('reading_progress', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id),
    ayahId: integer('ayah_id').notNull().references(() => ayahs.id),
    readAt: timestamp('read_at').defaultNow().notNull(),
    timeSpent: integer('time_spent').default(0), // seconds
}, (table) => ({
    userAyahIdx: uniqueIndex('progress_user_ayah_idx').on(table.userId, table.ayahId),
    userIdx: index('progress_user_idx').on(table.userId),
    readAtIdx: index('progress_read_at_idx').on(table.readAt),
}));

export const syncQueue = pgTable('sync_queue', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id),
    deviceId: varchar('device_id', { length: 255 }).notNull(),
    operation: varchar('operation', { length: 20 }).notNull(), // 'create' | 'update' | 'delete'
    tableName: varchar('table_name', { length: 100 }).notNull(),
    recordId: varchar('record_id', { length: 255 }).notNull(),
    data: jsonb('data').notNull(),
    syncStatus: varchar('sync_status', { length: 20 }).notNull().default('pending'), // 'pending' | 'synced' | 'conflict'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    syncedAt: timestamp('synced_at'),
}, (table) => ({
    userDeviceStatusIdx: index('sync_user_device_status_idx').on(table.userId, table.deviceId, table.syncStatus),
    createdAtIdx: index('sync_created_at_idx').on(table.createdAt),
}));
