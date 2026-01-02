import Fastify, { FastifyInstance } from 'fastify';
import dotenv from 'dotenv';
import quranRoutes from './routes/quran';

dotenv.config();

const server: FastifyInstance = Fastify({
    logger: true
});

server.register(quranRoutes, { prefix: '/v1' });

server.get('/', async (request, reply) => {
    return { status: 'ok', apps: 'rcqi-api' };
});

const start = async () => {
    try {
        await server.listen({ port: 3001, host: '0.0.0.0' });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
