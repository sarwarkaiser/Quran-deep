-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "vector"; -- For pgvector (semantic search)

-- Create database if not exists
SELECT 'CREATE DATABASE rcqi'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'rcqi')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE rcqi TO rcqi_user;
