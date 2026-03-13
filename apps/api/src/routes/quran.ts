import { FastifyPluginAsync } from 'fastify';
import { supabaseDb as db, supabaseSchema as schema } from '@rcqi/database';
import { eq, asc } from 'drizzle-orm';

const quranRoutes: FastifyPluginAsync = async (app) => {
    const parseId = (value: string) => {
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? null : parsed;
    };

    // List all surahs
    app.get('/surahs', async (req, reply) => {
        const surahs = await db.select().from(schema.surahs).orderBy(asc(schema.surahs.id));
        return surahs;
    });

    // Get specific surah details
    app.get<{ Params: { id: string } }>('/surahs/:id', async (req, reply) => {
        const id = parseId(req.params.id);
        if (id === null) {
            return reply.code(400).send({ error: 'Invalid surah id' });
        }

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
        const surahId = parseId(req.params.id);
        if (surahId === null) {
            return reply.code(400).send({ error: 'Invalid surah id' });
        }

        const ayahs = await db.query.ayahs.findMany({
            where: eq(schema.ayahs.surahId, surahId),
            orderBy: asc(schema.ayahs.ayahNumber),
        });
        return ayahs;
    });

    // Get a single ayah by surah and ayah number
    app.get<{ Params: { surahId: string; ayahNumber: string } }>(
        '/ayahs/:surahId/:ayahNumber',
        async (req, reply) => {
            const surahId = parseId(req.params.surahId);
            const ayahNumber = parseId(req.params.ayahNumber);

            if (surahId === null || ayahNumber === null) {
                return reply.code(400).send({ error: 'Invalid surah or ayah number' });
            }

            const ayah = await db.query.ayahs.findFirst({
                where: (ayahs, { and, eq }) =>
                    and(eq(ayahs.surahId, surahId), eq(ayahs.ayahNumber, ayahNumber)),
            });

            if (!ayah) {
                return reply.code(404).send({ error: 'Ayah not found' });
            }

            return ayah;
        }
    );

    // Get word morphology for a single ayah
    app.get<{ Params: { surahId: string; ayahNumber: string } }>(
        '/ayahs/:surahId/:ayahNumber/words',
        async (req, reply) => {
            const surahId = parseId(req.params.surahId);
            const ayahNumber = parseId(req.params.ayahNumber);

            if (surahId === null || ayahNumber === null) {
                return reply.code(400).send({ error: 'Invalid surah or ayah number' });
            }

            const ayah = await db.query.ayahs.findFirst({
                where: (ayahs, { and, eq }) =>
                    and(eq(ayahs.surahId, surahId), eq(ayahs.ayahNumber, ayahNumber)),
            });

            if (!ayah) {
                return reply.code(404).send({ error: 'Ayah not found' });
            }

            const words = await db.query.wordMorphology.findMany({
                where: eq(schema.wordMorphology.ayahId, ayah.id),
                orderBy: asc(schema.wordMorphology.wordPosition),
            });

            return words.map((word) => ({
                ayahId: word.ayahId,
                position: word.wordPosition,
                token: word.wordArabic,
                transliteration: word.transliteration,
                lemma: word.lemma,
                root: word.root,
                partOfSpeech: word.partOfSpeech,
                features: word.features,
            }));
        }
    );
};

export default quranRoutes;
