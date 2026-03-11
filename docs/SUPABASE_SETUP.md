# Supabase Setup Guide

This guide will help you migrate from local PostgreSQL to Supabase (managed PostgreSQL).

## Why Supabase?

- **Managed PostgreSQL** - No server maintenance
- **Built-in Auth** - User authentication ready
- **Real-time** - Live updates via WebSockets
- **Free Tier** - Generous limits for development
- **Easy Deployment** - Works great with Vercel/Netlify

## Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Choose a region close to you
4. Wait for the database to be provisioned (~2 minutes)

### 2. Get Connection Details

From your Supabase Dashboard:

1. **Project URL & Keys**:
   - Go to: Project Settings → API
   - Copy `Project URL` → `SUPABASE_URL`
   - Copy `anon public` → `SUPABASE_ANON_KEY`
   - Copy `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

2. **Database Connection String**:
   - Go to: Project Settings → Database
   - Copy the `URI` connection string
   - Replace `[YOUR-PASSWORD]` with your database password
   - This goes in `SUPABASE_DATABASE_URL`

### 3. Update Environment Variables

```bash
# Update .env file with your Supabase credentials
cp .env.example .env

# Edit .env and add:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

### 4. Run Migrations

#### Option A: Using Supabase SQL Editor (Easiest)

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `packages/database/src/migrations/0000_shiny_captain_america.sql`
3. Paste into SQL Editor
4. Click "Run"

#### Option B: Using Drizzle

```bash
cd packages/database
pnpm db:migrate
```

### 5. Seed the Quran Data

```bash
# Seed will use SUPABASE_DATABASE_URL
cd packages/etl
pnpm seed
```

### 6. Test Connection

```bash
cd packages/database
pnpm tsx -e "import { checkConnection } from './src/supabase-client'; checkConnection().then(console.log)"
```

## Switching Between Local and Supabase

### Use Supabase (Production)
```bash
# In .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_DATABASE_URL=postgresql://...
```

### Use Local (Development)
```bash
# In .env
# Comment out SUPABASE_URL and SUPABASE_DATABASE_URL
DATABASE_URL=postgresql://rcqi_user:rcqi_password@localhost:5432/rcci
```

## Important Notes

### Database Migrations
- Supabase uses PostgreSQL - all your Drizzle migrations work as-is
- Row Level Security (RLS) is enabled by default - configure policies for production

### Connection Pooling
- Supabase has connection limits (60 for free tier)
- Use connection pooling for serverless environments
- Connection string already includes pooling

### Storage
- For file uploads, use Supabase Storage
- Update your API to use Supabase Storage instead of local filesystem

### Real-time
- Enable real-time for tables you want to subscribe to
- Use Supabase client for live updates

## Troubleshooting

### Connection Failed
```
Error: connection to server failed
```
- Check if password is correct in connection string
- Ensure your IP is allowed (Supabase → Settings → Database → Network)

### Migration Failed
```
Error: permission denied
```
- Use the `service_role` key for migrations, not `anon` key

### Too Many Connections
```
Error: sorry, too many clients already
```
- Supabase free tier allows 60 connections
- Use connection pooling or reduce `max` in client config

## Next Steps

1. **Authentication**: Use Supabase Auth for user management
2. **Storage**: Migrate file uploads to Supabase Storage
3. **Real-time**: Add live updates for new RCQI analyses
4. **Edge Functions**: Use Supabase Edge Functions for API routes

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Drizzle with Supabase](https://orm.drizzle.team/docs/guides/postgresql-supabase)
