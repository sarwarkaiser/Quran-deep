# RCQI Platform - System Architecture Diagram

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App<br/>Next.js 14]
        IOS[iOS App<br/>React Native]
        AND[Android App<br/>React Native]
    end

    subgraph "API Gateway"
        API[Fastify API Server<br/>REST + GraphQL]
        AUTH[Authentication<br/>JWT]
        RATE[Rate Limiter]
    end

    subgraph "Application Layer"
        RCQI[RCQI Engine<br/>AI Analysis]
        SEARCH[Search Service<br/>Meilisearch]
        SYNC[Sync Engine<br/>Offline Support]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Main Database)]
        REDIS[(Redis<br/>Cache)]
        VECTOR[(pgvector<br/>Embeddings)]
    end

    subgraph "External Services"
        CLAUDE[Claude API<br/>Anthropic]
        EMBED[Embedding API<br/>OpenAI]
    end

    WEB --> API
    IOS --> API
    AND --> API
    
    API --> AUTH
    API --> RATE
    API --> RCQI
    API --> SEARCH
    API --> SYNC
    
    RCQI --> CLAUDE
    RCQI --> EMBED
    RCQI --> PG
    RCQI --> REDIS
    
    SEARCH --> PG
    SYNC --> PG
    
    API --> PG
    API --> REDIS
    API --> VECTOR
```

## Database Schema Relationships

```mermaid
erDiagram
    SURAHS ||--o{ AYAHS : contains
    AYAHS ||--o{ WORDS : has
    AYAHS ||--o{ TRANSLATIONS : has
    AYAHS ||--o{ RCQI_ANALYSIS : analyzed_by
    AYAHS ||--o{ SEMANTIC_CONNECTIONS : connects
    WORDS }o--|| ROOTS : derived_from
    TRANSLATIONS }o--|| TRANSLATORS : translated_by
    
    USERS ||--o{ RESEARCH_PROJECTS : creates
    USERS ||--o{ ANNOTATIONS : writes
    USERS ||--o{ BOOKMARKS : saves
    USERS ||--o{ READING_PROGRESS : tracks
    
    RESEARCH_PROJECTS ||--o{ ANNOTATIONS : contains
    AYAHS ||--o{ ANNOTATIONS : annotated
    AYAHS ||--o{ BOOKMARKS : bookmarked
    AYAHS ||--o{ READING_PROGRESS : read
    
    SURAHS {
        int id PK
        string nameArabic
        string nameTransliterated
        int ayahCount
        string revelationPeriod
    }
    
    AYAHS {
        bigint id PK
        int surahId FK
        int ayahNumber
        text textArabic
        vector embedding
    }
    
    RCQI_ANALYSIS {
        bigint id PK
        bigint ayahId FK
        string analysisType
        jsonb result
        timestamp expiresAt
    }
```

## Data Flow - RCQI Analysis

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Cache
    participant RCQI
    participant Claude
    participant DB

    Client->>API: POST /rcqi/analyze {ayahId, type}
    API->>Cache: Check cache
    
    alt Cache Hit
        Cache-->>API: Return cached analysis
        API-->>Client: Analysis result (cached)
    else Cache Miss
        API->>DB: Fetch ayah text
        DB-->>API: Ayah data
        API->>RCQI: Analyze ayah
        RCQI->>Claude: Request analysis
        Claude-->>RCQI: Analysis result
        RCQI->>DB: Store in cache
        RCQI->>Cache: Update Redis
        RCQI-->>API: Analysis result
        API-->>Client: Analysis result (fresh)
    end
```

## Offline Sync Flow

```mermaid
sequenceDiagram
    participant Mobile
    participant LocalDB
    participant SyncQueue
    participant API
    participant ServerDB

    Note over Mobile: User creates annotation (offline)
    Mobile->>LocalDB: Save annotation
    Mobile->>SyncQueue: Add to sync queue
    
    Note over Mobile: Device comes online
    Mobile->>API: POST /sync/push {operations}
    API->>ServerDB: Apply operations
    
    alt No Conflicts
        ServerDB-->>API: Success
        API->>Mobile: Sync complete
        Mobile->>SyncQueue: Clear synced items
    else Conflict Detected
        ServerDB-->>API: Conflict data
        API-->>Mobile: Conflict response
        Mobile->>Mobile: Resolve conflict
        Mobile->>API: POST /sync/resolve
    end
    
    Mobile->>API: GET /sync/pull {since}
    API->>ServerDB: Fetch new operations
    ServerDB-->>API: Server operations
    API-->>Mobile: Operations to apply
    Mobile->>LocalDB: Apply server changes
```

## Technology Stack Layers

```mermaid
graph LR
    subgraph "Frontend"
        A1[Next.js 14]
        A2[React Native]
        A3[Tailwind CSS]
        A4[shadcn/ui]
    end
    
    subgraph "State Management"
        B1[Zustand]
        B2[TanStack Query]
        B3[React Context]
    end
    
    subgraph "API Layer"
        C1[Fastify]
        C2[GraphQL]
        C3[REST]
        C4[WebSocket]
    end
    
    subgraph "Business Logic"
        D1[RCQI Engine]
        D2[Search Service]
        D3[Sync Engine]
        D4[Auth Service]
    end
    
    subgraph "Data Layer"
        E1[Drizzle ORM]
        E2[PostgreSQL]
        E3[Redis]
        E4[Meilisearch]
    end
    
    subgraph "External"
        F1[Claude API]
        F2[OpenAI Embeddings]
    end
    
    A1 --> B1
    A2 --> B2
    B1 --> C1
    B2 --> C2
    C1 --> D1
    C2 --> D2
    D1 --> E1
    D2 --> E4
    E1 --> E2
    D1 --> F1
    D1 --> F2
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "CDN"
        CF[Cloudflare]
    end
    
    subgraph "Web Hosting"
        VERCEL[Vercel<br/>Next.js App]
    end
    
    subgraph "Mobile"
        EXPO[Expo EAS<br/>OTA Updates]
        APPLE[App Store]
        GOOGLE[Play Store]
    end
    
    subgraph "API Infrastructure"
        LB[Load Balancer]
        API1[API Server 1]
        API2[API Server 2]
        API3[API Server 3]
    end
    
    subgraph "Data Services"
        PG_PRIMARY[(PostgreSQL<br/>Primary)]
        PG_REPLICA[(PostgreSQL<br/>Read Replica)]
        REDIS_CLUSTER[(Redis Cluster)]
        MEILI[Meilisearch]
    end
    
    subgraph "Monitoring"
        SENTRY[Sentry<br/>Error Tracking]
        DATADOG[Datadog<br/>APM]
    end
    
    CF --> VERCEL
    CF --> LB
    
    LB --> API1
    LB --> API2
    LB --> API3
    
    API1 --> PG_PRIMARY
    API2 --> PG_REPLICA
    API3 --> PG_REPLICA
    
    API1 --> REDIS_CLUSTER
    API2 --> REDIS_CLUSTER
    API3 --> REDIS_CLUSTER
    
    API1 --> MEILI
    
    API1 --> SENTRY
    API1 --> DATADOG
    
    EXPO --> APPLE
    EXPO --> GOOGLE
```

## Security Architecture

```mermaid
graph TB
    subgraph "Client Security"
        A1[HTTPS Only]
        A2[JWT Storage]
        A3[Input Validation]
    end
    
    subgraph "API Security"
        B1[Rate Limiting]
        B2[JWT Verification]
        B3[CORS]
        B4[Helmet.js]
    end
    
    subgraph "Database Security"
        C1[Row-Level Security]
        C2[Encrypted at Rest]
        C3[SSL Connections]
        C4[Prepared Statements]
    end
    
    subgraph "Infrastructure"
        D1[Firewall Rules]
        D2[VPC]
        D3[Secrets Manager]
        D4[Audit Logs]
    end
    
    A1 --> B1
    A2 --> B2
    A3 --> B3
    
    B2 --> C1
    B4 --> C3
    
    C1 --> D1
    C3 --> D2
```

## Caching Strategy

```mermaid
graph LR
    subgraph "Client Cache"
        A1[Browser Cache<br/>Static Assets]
        A2[IndexedDB<br/>Offline Data]
        A3[React Query<br/>API Cache]
    end
    
    subgraph "CDN Cache"
        B1[Cloudflare<br/>Edge Cache]
    end
    
    subgraph "Application Cache"
        C1[Redis<br/>API Responses]
        C2[Redis<br/>Session Data]
        C3[Redis<br/>Rate Limits]
    end
    
    subgraph "Database Cache"
        D1[PostgreSQL<br/>Query Cache]
        D2[Materialized Views]
    end
    
    A1 -.->|Miss| B1
    B1 -.->|Miss| C1
    C1 -.->|Miss| D1
    D1 -.->|Miss| Database[(Database)]
```

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response (cached) | < 100ms | p95 |
| API Response (uncached) | < 500ms | p95 |
| Search Response | < 50ms | p95 |
| Database Query | < 50ms | p95 |
| Page Load (Web) | < 2s | LCP |
| App Launch (Mobile) | < 1s | Cold start |
| Sync Operation | < 2s | 100 items |

## Scalability Targets

| Resource | Initial | 1 Year | 5 Years |
|----------|---------|--------|---------|
| Users | 1K | 100K | 1M |
| API Requests/day | 100K | 10M | 100M |
| Database Size | 10GB | 100GB | 1TB |
| Concurrent Users | 100 | 10K | 100K |

