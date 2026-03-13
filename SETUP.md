# RCQI Platform - Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Prerequisites Check

Ensure you have:
- ✅ Node.js 20+ installed (`node --version`)
- ✅ pnpm 8+ installed (`pnpm --version` or `npm install -g pnpm`)
- ✅ Docker Desktop running
- ✅ Anthropic API key ([Get one here](https://console.anthropic.com/))

### Step 2: Clone and Install

```bash
cd "c:\Users\sarwa\Quran deep\rcqi-platform"
pnpm install
```

This will install all dependencies for the monorepo (~2-3 minutes).

### Step 3: Environment Setup

```bash
# Copy environment template
copy .env.example .env

# Edit .env and add your API key
notepad .env
```

**Required variables:**
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Optional (defaults work for local dev):**
```env
DATABASE_URL=postgresql://rcqi_user:rcqi_password@localhost:5432/rcqi
REDIS_URL=redis://localhost:6379
MEILISEARCH_URL=http://localhost:7700
```

### Step 4: Start Infrastructure

```bash
cd infrastructure\docker
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Meilisearch (port 7700)

**Verify services:**
```bash
docker-compose ps
```

All services should show "Up" status.

### Step 5: Database Setup

```bash
# Return to root directory
cd ..\..

# Generate Drizzle schema
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed with sample data (optional)
pnpm db:seed
```

### Step 6: Start Development

```bash
pnpm dev
```

This starts all apps in parallel:
- 🌐 Web: http://localhost:3010
- 🔌 API: http://localhost:3011
- 📊 API Docs: http://localhost:3011/docs

### Step 7: Verify Installation

**Test API:**
```bash
curl http://localhost:3011/health
```

Expected response: `{"status":"ok"}`

**Test Database:**
```bash
curl http://localhost:3011/v1/surahs
```

Should return list of surahs (if seeded).

---

## 📱 Mobile Development

### iOS (Mac only)

```bash
cd apps\mobile
pnpm expo start

# Press 'i' to open iOS simulator
```

### Android

```bash
cd apps\mobile
pnpm expo start

# Press 'a' to open Android emulator
```

### Physical Device

1. Install Expo Go from App Store/Play Store
2. Scan QR code from terminal
3. App loads instantly!

---

## 🛠️ Common Commands

### Development

```bash
pnpm dev              # Start all apps
pnpm build            # Build all apps
pnpm test             # Run all tests
pnpm lint             # Lint all code
pnpm format           # Format with Prettier
```

### Database

```bash
pnpm db:generate      # Generate Drizzle schema
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:studio        # Open Drizzle Studio (GUI)
```

### Docker

```bash
# Start services
cd infrastructure\docker
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart service
docker-compose restart postgres
```

### Package-specific

```bash
# Run command in specific package
pnpm --filter @rcqi/web dev
pnpm --filter @rcqi/api test
pnpm --filter @rcqi/shared build
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Windows: Find and kill process
netstat -ano | findstr :3010
taskkill /PID <process_id> /F
```

### Docker Issues

```bash
# Reset Docker
docker-compose down -v
docker-compose up -d

# Check logs
docker-compose logs postgres
docker-compose logs redis
```

### Database Connection Failed

1. Ensure Docker is running: `docker ps`
2. Check DATABASE_URL in `.env`
3. Restart PostgreSQL: `docker-compose restart postgres`

### pnpm Install Fails

```bash
# Clear cache and reinstall
pnpm store prune
rm -rf node_modules
pnpm install
```

### Expo/Mobile Issues

```bash
cd apps\mobile

# Clear cache
pnpm expo start -c

# Reset Metro bundler
pnpm expo start --clear
```

---

## 📚 Next Steps

1. **Explore the API**: http://localhost:3011/docs
2. **Read the Docs**: See `README.md` for detailed documentation
3. **View Architecture**: See `ARCHITECTURE.md` for system design
4. **Check Examples**: See `apps/web/app/` for Next.js examples
5. **Join Community**: (Add Discord/Slack link)

---

## 🎯 Development Workflow

### Creating a New Feature

1. **Create branch**: `git checkout -b feature/my-feature`
2. **Make changes**: Edit code in relevant package
3. **Test**: `pnpm test`
4. **Lint**: `pnpm lint`
5. **Commit**: `git commit -m "feat: add my feature"`
6. **Push**: `git push origin feature/my-feature`

### Adding a New Package

```bash
# Create package directory
mkdir packages\my-package
cd packages\my-package

# Initialize package.json
pnpm init

# Add to workspace (already configured in pnpm-workspace.yaml)
```

### Database Changes

```bash
# 1. Edit schema in packages/database/src/schema/
# 2. Generate migration
pnpm db:generate

# 3. Review migration in packages/database/src/migrations/
# 4. Apply migration
pnpm db:migrate
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change all default passwords in `.env`
- [ ] Generate strong JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Enable database backups
- [ ] Set up monitoring (Sentry, Datadog)
- [ ] Review and restrict API permissions
- [ ] Enable row-level security in PostgreSQL
- [ ] Rotate API keys regularly

---

## 📞 Getting Help

- **Documentation**: See `README.md`
- **Issues**: Create GitHub issue
- **Discussions**: GitHub Discussions
- **Email**: support@rcqi.app

---

**Happy Coding! 🚀**
