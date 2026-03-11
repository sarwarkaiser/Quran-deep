import { FastifyPluginAsync } from 'fastify';
import { supabaseDb as db, supabaseSchema as schema } from '@rcqi/database';
import { eq, asc } from 'drizzle-orm';

const quranRoutes: FastifyPluginAsync = async (app) => {
    // List all surahs
    app.get('/surahs', async (req, reply) => {
        const surahs = await db.select().from(schema.surahs).orderBy(asc(schema.surahs.id));
        return surahs;
    });

    // Get specific surah details
    app.get<{ Params: { id: string } }>('/surahs/:id', async (req, reply) => {
        const id = parseInt(req.params.id);
        const surah = await db.query.surahs.findFirst({
            where: eq(schema.surahs.id, id),
        });
        if (!surah) {
            return reply.code(404).send({ error: 'Surah not found' });
        }
        return surah;
    });

    // Get ayahs for a surah
    app.get<{ Params: { id: string } }>('/surahs/:id/ayahs', async (req, reply) => {
        const surahId = parseInt(req.params.id);
        const ayahs = await db.query.ayahs.findMany({
            where: eq(schema.ayahs.surahId, surahId),
            orderBy: asc(schema.ayahs.ayahNumber),
        });
        return ayahs;
    });
};

export default quranRoutes;
