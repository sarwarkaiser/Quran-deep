#!/bin/bash
set -e

echo "=========================================="
echo "RCQI Data Setup Script"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd "$(dirname "$0")/.."

echo -e "${YELLOW}Step 1: Starting infrastructure...${NC}"
docker-compose -f infrastructure/docker/docker-compose.yml up -d postgres redis 2>/dev/null || echo "Infrastructure already running or using external services"

echo -e "${YELLOW}Step 2: Waiting for PostgreSQL...${NC}"
sleep 3

echo -e "${YELLOW}Step 3: Running database migrations...${NC}"
pnpm --filter @rcqi/database migrate

echo -e "${YELLOW}Step 4: Seeding Quran text (6,236 ayahs)...${NC}"
pnpm --filter @rcqi/etl seed

echo -e "${YELLOW}Step 5: Downloading word morphology data...${NC}"
pnpm --filter @rcqi/etl fetch:morphology

echo -e "${YELLOW}Step 6: Ingesting morphology to database...${NC}"
pnpm --filter @rcqi/etl ingest:morphology

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}Data setup complete!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "You can now:"
echo "  1. Start the API: pnpm --filter @rcqi/api dev"
echo "  2. Test RCQI analysis:"
echo "     curl -X POST http://localhost:3011/v1/rcqi/analyze/1/2"
echo ""
