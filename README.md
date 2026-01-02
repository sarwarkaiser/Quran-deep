# RCQI Platform - Root-Contextual Quranic Intelligence

A modern, multi-platform Quran research platform with AI-powered linguistic analysis, offline-first capabilities, and comprehensive research tools.

## 🌟 Features

- **Multi-Platform Support**: Web (Next.js), iOS & Android (React Native/Expo)
- **Offline-First**: Full offline reading with intelligent sync
- **AI-Powered Analysis**: Claude-powered root word analysis, semantic search, and thematic connections
- **Morphological Analysis**: Integration with Quranic Arabic Corpus for detailed word-by-word morphology
- **Research Tools**: Projects, annotations, citations, and collaborative features
- **6,236 Ayahs**: Complete Quran with multiple translations
- **Advanced Search**: Meilisearch-powered typo-tolerant search
- **Type-Safe**: End-to-end TypeScript with Drizzle ORM

## 🏗️ Architecture

### Technology Stack

- **Frontend**:
  - Web: Next.js 14 (App Router, React Server Components)
  - Mobile: React Native with Expo (80%+ code sharing)
  - UI: Tailwind CSS, shadcn/ui, React Native Paper
  - State: Zustand + TanStack Query

- **Backend**:
  - API: Node.js with Fastify (3x faster than Express)
  - Database: PostgreSQL 16 with Drizzle ORM
  - Cache: Redis 7
  - Search: Meilisearch
  - AI: Claude 3.5 Sonnet + pgvector

- **Infrastructure**:
  - Monorepo: Turborepo with pnpm
  - Containers: Docker + Docker Compose
  - CI/CD: GitHub Actions

### Project Structure

```
rcqi-platform/
├── apps/
│   ├── web/              # Next.js web application
│   ├── mobile/           # React Native mobile app
│   └── api/              # Fastify API server
├── packages/
│   ├── shared/           # Shared types & utilities
│   ├── database/         # Drizzle ORM schemas
│   ├── etl/              # Data ingestion (Tanzil, Quranic Corpus)
│   ├── rcqi-engine/      # AI analysis engine
│   ├── ui-components/    # Shared React components
│   ├── sync-engine/      # Offline sync logic
│   └── search-client/    # Meilisearch client
└── infrastructure/
    └── docker/           # Docker configurations
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- Anthropic API key (for Claude)

### Installation

1. **Clone the repository**:
   ```bash
   cd "c:\Users\sarwa\Quran deep\rcqi-platform"
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

4. **Start infrastructure services**:
   ```bash
   cd infrastructure/docker
   docker-compose up -d postgres redis meilisearch
   ```

5. **Run database migrations**:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   pnpm db:seed
   ```

6. **Start development servers**:
   ```bash
   pnpm dev
   ```

   This starts:
   - Web app: http://localhost:3000
   - API server: http://localhost:3001
   - Meilisearch: http://localhost:7700

### Mobile Development

```bash
cd apps/mobile
pnpm expo start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app for physical device

## 📦 Packages

### @rcqi/shared
Shared TypeScript types, utilities, and constants used across all packages.

**Key exports**:
- Types: `Surah`, `Ayah`, `Word`, `Root`, `Translation`, `RCQIAnalysis`
- Utils: Arabic text processing, validation, formatting
- Constants: Surah metadata, translator information

### @rcqi/database
Drizzle ORM schemas and database client for PostgreSQL.

**Tables**:
- `surahs`, `ayahs`, `words`, `roots`, `translations`
- `rcqi_analysis_cache`, `semantic_connections`
- `users`, `sessions`
- `research_projects`, `annotations`, `bookmarks`
- `reading_progress`, `sync_queue`

**Usage**:
```typescript
import { db, schema } from '@rcqi/database';

const ayah = await db.query.ayahs.findFirst({
  where: eq(schema.ayahs.id, 1),
  with: {
    translations: true,
    words: true,
  },
});
```

### @rcqi/rcqi-engine
AI-powered analysis engine using Claude API.

**Features**:
- Root word analysis with derivatives
- Semantic search with embeddings
- Thematic connection discovery
- Cross-reference suggestions
- Analysis caching (30-day TTL)

**Usage**:
```typescript
import { rcqiEngine } from '@rcqi/rcqi-engine';

const analysis = await rcqiEngine.analyze({
  ayahId: '123',
  analysisType: 'root',
  options: { forceRefresh: false },
});
```

## 🗄️ Database Schema

### Core Tables

**surahs**: 114 surahs with metadata
- Revelation period, phase, order
- Historical context
- Ayah count

**ayahs**: 6,236 ayahs
- Arabic text (Uthmani, Indopak, simplified)
- Juz, hizb, page numbers
- Vector embeddings for semantic search
- Metadata (word count, themes)

**words**: Individual words with morphology
- Position in ayah
- Root reference
- Grammatical analysis

**roots**: Trilateral/quadrilateral roots
- Semantic fields
- Derivative count
- Related roots

### RCQI Tables

**rcqi_analysis_cache**: AI analysis results
- Analysis type (root, semantic, thematic)
- Cached results (30-day expiration)
- Token usage tracking

**semantic_connections**: Ayah relationships
- Connection type and strength
- Shared roots and themes
- AI confidence scores

### Research Tables

**research_projects**: User research organization
- Public/private projects
- Collaborators
- Tags and metadata

**annotations**: Rich text notes
- Highlights and citations
- Project association
- Full-text search

## 🔍 API Endpoints

### REST API

```
Base URL: http://localhost:3001/v1

# Quran Content
GET    /surahs
GET    /surahs/:id
GET    /surahs/:id/ayahs
GET    /ayahs/:surahId/:ayahNumber

# RCQI Analysis
POST   /rcqi/analyze
GET    /rcqi/analysis/:ayahId
GET    /rcqi/semantic-search

# Search
GET    /search?q=mercy&type=translation

# Research
GET    /projects
POST   /projects
GET    /annotations
POST   /annotations

# User
POST   /auth/login
POST   /auth/register
GET    /bookmarks
POST   /bookmarks
```

### GraphQL

```
Endpoint: http://localhost:3001/graphql

query {
  ayah(surahId: 1, ayahNumber: 2) {
    textArabic
    translations {
      text
      translator { name }
    }
    rcqiAnalysis(type: ROOT) {
      roots {
        word
        derivatives
        semanticField
      }
    }
  }
}
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @rcqi/shared test

# Run E2E tests
pnpm --filter @rcqi/web test:e2e
```

## 📱 Mobile Features

- **Offline Reading**: Full Quran cached locally (SQLite)
- **Sync Engine**: Intelligent conflict resolution
- **Background Sync**: Automatic sync when online
- **Push Notifications**: Study reminders
- **OTA Updates**: Instant app updates via Expo

## 🔐 Security

- JWT authentication with refresh tokens
- Row-level security in PostgreSQL
- Rate limiting (100 req/min free, 1000 req/min pro)
- API key authentication for programmatic access
- Encrypted data at rest and in transit

## 🚢 Deployment

### Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Vercel (Web)

```bash
cd apps/web
vercel deploy --prod
```

### EAS (Mobile)

```bash
cd apps/mobile
eas build --platform all
eas submit --platform all
```

## 📊 Performance

- **API Response Time**: < 100ms (cached), < 500ms (uncached)
- **Search**: < 50ms with Meilisearch
- **Database Queries**: Optimized with indexes and materialized views
- **Bundle Size**: 
  - Web: < 200KB initial JS
  - Mobile: < 50MB app size

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Quran text from [Tanzil.net](https://tanzil.net)
- Translations from various scholars
- AI analysis powered by Anthropic Claude
- Built with ❤️ for the Muslim community

## 📞 Support

- Documentation: [docs.rcqi.app](https://docs.rcqi.app)
- Issues: [GitHub Issues](https://github.com/rcqi/platform/issues)
- Email: support@rcqi.app

---

**Built with**: TypeScript • Next.js • React Native • Fastify • PostgreSQL • Redis • Meilisearch • Claude AI
