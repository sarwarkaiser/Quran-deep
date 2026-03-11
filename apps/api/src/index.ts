import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import quranRoutes from './routes/quran';
import rcqiRoutes from './routes/rcqi';

dotenv.config();

const server: FastifyInstance = Fastify({
  logger: true,
});

// Register CORS - allow all origins in development
server.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// Register routes
server.register(quranRoutes, { prefix: '/v1' });
server.register(rcqiRoutes, { prefix: '/v1' });

// Health check
server.get('/', async (request, reply) => {
  return {
    status: 'ok',
    app: 'rcqi-api',
    version: '1.0.0',
    endpoints: {
      quran: '/v1/surahs',
      rcqi: {
        analyze: 'POST /v1/rcqi/analyze/:surah/:ayah',
        getAnalysis: 'GET /v1/rcqi/analysis/:surah/:ayah',
        batchAnalyze: 'POST /v1/rcqi/analyze/batch',
        semanticSearch: 'GET /v1/rcqi/semantic-search?q=query',
        connections: 'GET /v1/rcqi/connections/:surah/:ayah',
      },
    },
  };
});

const start = async () => {
  try {
    const port = parseInt(process.env.API_PORT || '3001');
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`RCQI API server running on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
