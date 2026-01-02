/**
 * Research and annotation types
 */

import type { AyahReference } from './quran';

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'researcher' | 'admin';
    subscriptionTier: 'free' | 'pro' | 'academic';
    preferences: UserPreferences;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserPreferences {
    defaultTranslator: number;
    arabicFont: 'uthmani' | 'indopak' | 'standard';
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    language: string;
}

export interface ResearchProject {
    id: string;
    userId: string;
    title: string;
    description?: string;
    isPublic: boolean;
    collaborators: string[];
    tags: string[];
    metadata: {
        methodology?: string;
        objectives?: string[];
        status: 'draft' | 'active' | 'completed';
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface Annotation {
    id: string;
    projectId: string;
    ayahId: string;
    userId: string;
    noteText: string;
    noteHtml?: string;
    highlightedText?: string;
    highlightColor?: string;
    tags: string[];
    citations: Citation[];
    isPrivate: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Citation {
    type: 'book' | 'article' | 'website' | 'quran' | 'hadith';
    title: string;
    author?: string;
    year?: number;
    publisher?: string;
    url?: string;
    reference?: AyahReference;
    notes?: string;
}

export interface Bookmark {
    id: string;
    userId: string;
    ayahId: string;
    category?: string;
    notes?: string;
    createdAt: Date;
}

export interface ReadingProgress {
    userId: string;
    ayahId: string;
    readAt: Date;
    timeSpent: number; // seconds
}

export interface ReadingStats {
    userId: string;
    totalAyahsRead: number;
    totalTimeSpent: number;
    currentStreak: number;
    longestStreak: number;
    lastReadAt?: Date;
    progressByJuz: Record<number, number>; // juz -> percentage
}
