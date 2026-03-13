import type { AuthorInterpretation, WordAnalysisData } from '../prompts/rcqi-master-prompt';
import { starterSourceCorpus, type SourceAuthor, type SourceCorpusEntry } from './starter-corpus';

export interface SourceGroundingSummary {
  totalHits: number;
  authorsWithHits: number;
  byAuthor: Record<SourceAuthor, number>;
  citations: string[];
}

export interface OriginalSourceContext {
  promptBlock: string;
  interpretations: {
    farahi?: AuthorInterpretation;
    raghib?: AuthorInterpretation;
    izutsu?: AuthorInterpretation;
    asad?: AuthorInterpretation;
  };
  grounding: SourceGroundingSummary;
}

interface SourceLookupParams {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  wordData: WordAnalysisData[];
}

type ScoredEntry = SourceCorpusEntry & { score: number };

const AUTHORS: SourceAuthor[] = ['farahi', 'raghib', 'izutsu', 'asad'];

function normalizeRoot(value: string | null | undefined) {
  return (value || '').replace(/\s+/g, '');
}

function dedupe<T>(items: T[]) {
  return Array.from(new Set(items));
}

function scoreEntry(entry: SourceCorpusEntry, params: SourceLookupParams, roots: Set<string>) {
  let score = 0;

  if (entry.scope === 'global') {
    score += 10;
  }

  if (entry.surahNumber === params.surahNumber) {
    score += 25;
  }

  if (entry.surahNumber === params.surahNumber && entry.ayahNumber === params.ayahNumber) {
    score += 100;
  }

  const matchedRoots = (entry.roots || []).filter((root) => roots.has(normalizeRoot(root)));
  if (matchedRoots.length > 0) {
    score += matchedRoots.length * 20;
  }

  if (entry.concepts && entry.concepts.length > 0) {
    const terms = `${params.surahName} ${params.wordData
      .map((word) => `${word.lemma} ${word.translation || ''}`)
      .join(' ')}`.toLowerCase();
    const conceptMatches = entry.concepts.filter((concept) => terms.includes(concept.toLowerCase()));
    score += conceptMatches.length * 8;
  }

  return score;
}

function formatPromptBlock(author: SourceAuthor, hits: ScoredEntry[]) {
  if (hits.length === 0) {
    return `${author.toUpperCase()}:\n- No local source packet is indexed for this author for the current ayah/root set. State explicitly that no accessible statement was found and do not invent one.`;
  }

  const lines = hits.slice(0, 3).map((hit, index) => {
    const parts = [`${index + 1}. [${hit.scope}] ${hit.citation}`, `   Summary: ${hit.summary}`];

    if (hit.translation) {
      parts.push(`   Translation summary: ${hit.translation}`);
    }

    if (hit.notes) {
      parts.push(`   Notes: ${hit.notes}`);
    }

    if (hit.inference) {
      parts.push(`   Safe inference: ${hit.inference}`);
    }

    return parts.join('\n');
  });

  return `${author.toUpperCase()}:\n${lines.join('\n')}`;
}

function buildInterpretation(hits: ScoredEntry[]): AuthorInterpretation | undefined {
  if (hits.length === 0) {
    return undefined;
  }

  const topHits = hits.slice(0, 3);
  const summary = dedupe(topHits.map((hit) => hit.summary).filter(Boolean)).join(' ');
  const inferenceHit = topHits.find((hit) => hit.inference);
  const citations = dedupe(topHits.map((hit) => hit.citation).filter(Boolean));
  const noteLines = [
    citations.length > 0 ? `Grounded from local source pack: ${citations.join('; ')}.` : '',
    ...topHits.map((hit) => hit.notes).filter(Boolean),
  ].filter(Boolean);

  return {
    hasDirectComment: topHits.some((hit) => Boolean(hit.hasDirectComment)),
    summary,
    inference: inferenceHit?.inference,
    inferenceConfidence: inferenceHit?.inferenceConfidence,
    translation: topHits.find((hit) => hit.translation)?.translation,
    notes: noteLines.join(' '),
  };
}

export function buildOriginalSourceContext(params: SourceLookupParams): OriginalSourceContext {
  const roots = new Set(
    params.wordData.map((word) => normalizeRoot(word.root)).filter(Boolean)
  );

  const hitsByAuthor = AUTHORS.reduce<Record<SourceAuthor, ScoredEntry[]>>(
    (accumulator, author) => {
      const hits = starterSourceCorpus
        .filter((entry) => entry.author === author)
        .map((entry) => ({ ...entry, score: scoreEntry(entry, params, roots) }))
        .filter((entry) => entry.score > 0)
        .sort((left, right) => right.score - left.score);

      accumulator[author] = hits;
      return accumulator;
    },
    {
      farahi: [],
      raghib: [],
      izutsu: [],
      asad: [],
    }
  );

  const citations = dedupe(
    AUTHORS.flatMap((author) => hitsByAuthor[author].slice(0, 3).map((hit) => hit.citation))
  );

  return {
    promptBlock: [
      'LOCAL SOURCE PACKETS FOR "originalSources":',
      'Use only these packets for the Original Source Interpretations layer.',
      'If an author has no packet below, explicitly say no accessible statement was found and do not invent one.',
      '',
      ...AUTHORS.map((author) => formatPromptBlock(author, hitsByAuthor[author])),
    ].join('\n'),
    interpretations: {
      farahi: buildInterpretation(hitsByAuthor.farahi),
      raghib: buildInterpretation(hitsByAuthor.raghib),
      izutsu: buildInterpretation(hitsByAuthor.izutsu),
      asad: buildInterpretation(hitsByAuthor.asad),
    },
    grounding: {
      totalHits: AUTHORS.reduce((total, author) => total + hitsByAuthor[author].length, 0),
      authorsWithHits: AUTHORS.filter((author) => hitsByAuthor[author].length > 0).length,
      byAuthor: {
        farahi: hitsByAuthor.farahi.length,
        raghib: hitsByAuthor.raghib.length,
        izutsu: hitsByAuthor.izutsu.length,
        asad: hitsByAuthor.asad.length,
      },
      citations,
    },
  };
}
