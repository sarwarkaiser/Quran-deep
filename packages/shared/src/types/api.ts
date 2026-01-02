/**
 * API request/response types
 */

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        cached?: boolean;
    };
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
    q: string;
    type?: 'translation' | 'phonetic' | 'semantic' | 'all';
    filters?: SearchFilters;
}

export interface SearchFilters {
    surahId?: number;
    ayahStart?: number;
    ayahEnd?: number;
    juzNumber?: number;
    topics?: string[];
    translatorId?: number;
    language?: string;
}

export interface SearchResult<T = any> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

export interface SyncOperation {
    id: string;
    operation: 'create' | 'update' | 'delete';
    tableName: string;
    recordId: string;
    data: Record<string, any>;
    timestamp: number;
    deviceId: string;
}

export interface SyncRequest {
    operations: SyncOperation[];
    deviceId: string;
    lastSyncAt?: number;
}

export interface SyncResponse {
    success: boolean;
    synced: string[]; // operation IDs
    conflicts: SyncConflict[];
    serverOperations: SyncOperation[];
    lastSyncAt: number;
}

export interface SyncConflict {
    operationId: string;
    reason: 'version_mismatch' | 'deleted' | 'permission_denied';
    serverVersion?: Record<string, any>;
    clientVersion?: Record<string, any>;
}
