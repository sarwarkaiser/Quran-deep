"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ayah, RCQIAnalysis, Surah, TokenRootCard, Word } from "@/types";
import { cn, formatArabicNumber } from "@/lib/utils";
import { WordDetailPanel } from "./WordDetailPanel";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";

interface QuranReaderProps {
  ayahs: Ayah[];
  surah: Surah | null;
  wordsByAyah: Record<number, Word[]>;
  analysesByAyah: Record<number, RCQIAnalysis | null>;
  loadingWordAyahs: number[];
  loadingAnalysisAyahs: number[];
  onWordFocus: (ayah: Ayah) => Promise<void> | void;
  onGenerateAyahAnalysis: (ayah: Ayah) => Promise<void> | void;
}

interface SelectedWordState {
  ayah: Ayah;
  word: Word;
}

const ARABIC_CLEANUP_PATTERN = /[ۖۗۘۙۚۛۜ۟۠ۡ]/g;

function normalizeArabicToken(token: string) {
  return token
    .replace(ARABIC_CLEANUP_PATTERN, "")
    .replace(/[^\u0600-\u06FF]/g, "");
}

export function QuranReader({
  ayahs,
  surah,
  wordsByAyah,
  analysesByAyah,
  loadingWordAyahs,
  loadingAnalysisAyahs,
  onWordFocus,
  onGenerateAyahAnalysis,
}: QuranReaderProps) {
  const [selected, setSelected] = useState<SelectedWordState | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [surah?.id]);

  const parseFallbackWords = useCallback((ayah: Ayah): Word[] => {
    const sourceText = ayah.textUthmani || ayah.textArabic;
    return sourceText
      .split(/\s+/)
      .filter(Boolean)
      .map((token, index) => ({
        ayahId: ayah.id,
        position: index + 1,
        token: token.replace(ARABIC_CLEANUP_PATTERN, ""),
        transliteration: null,
        lemma: null,
        root: null,
        partOfSpeech: null,
      }));
  }, []);

  const getDisplayWords = useCallback(
    (ayah: Ayah) => {
      const words = wordsByAyah[ayah.ayahNumber];
      if (words && words.length > 0) {
        return words;
      }

      return parseFallbackWords(ayah);
    },
    [parseFallbackWords, wordsByAyah]
  );

  const findRootCard = useCallback(
    (word: Word, analysis: RCQIAnalysis | null | undefined): TokenRootCard | undefined => {
      if (!analysis?.tokenRootCards?.length) {
        return undefined;
      }

      const normalizedWord = normalizeArabicToken(word.token);
      return analysis.tokenRootCards.find((card) => {
        const normalizedCard = normalizeArabicToken(card.token);
        return (
          normalizedCard === normalizedWord ||
          normalizedCard.includes(normalizedWord) ||
          normalizedWord.includes(normalizedCard)
        );
      });
    },
    []
  );

  const selectedWord = useMemo(() => {
    if (!selected) {
      return null;
    }

    return (
      wordsByAyah[selected.ayah.ayahNumber]?.find(
        (word) => word.position === selected.word.position
      ) ?? selected.word
    );
  }, [selected, wordsByAyah]);

  const selectedAnalysis = selected
    ? analysesByAyah[selected.ayah.ayahNumber] ?? null
    : null;
  const selectedRootCard = selectedWord
    ? findRootCard(selectedWord, selectedAnalysis)
    : undefined;

  return (
    <div className="grid h-[calc(100vh-12rem)] gap-4 xl:grid-cols-[minmax(0,1fr),400px]">
        <div className="min-h-0 rounded-[28px] border border-border/70 bg-card/80 shadow-[0_20px_60px_rgba(69,54,27,0.08)]">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-6">
            <section className="mb-6 overflow-hidden rounded-[26px] border border-primary/20 bg-[linear-gradient(135deg,rgba(251,247,238,0.98),rgba(241,231,209,0.92))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
                    Interactive Reading Surface
                  </p>
                  <h2 className="mt-3 font-display text-4xl text-primary md:text-5xl">
                    {surah?.nameEnglish}
                  </h2>
                  <p className="mt-2 font-arabic text-3xl text-foreground/80">
                    {surah?.nameArabic}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className="border-primary/20 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                    Click any word
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    Morphology on demand
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    Ayah-level RCQI
                  </Badge>
                </div>
              </div>
            </section>

            <div className="space-y-4">
              {ayahs.map((ayah, index) => {
                const words = getDisplayWords(ayah);
                const analysis = analysesByAyah[ayah.ayahNumber];
                const isWordsLoading = loadingWordAyahs.includes(ayah.ayahNumber);
                const isAnalysisLoading = loadingAnalysisAyahs.includes(ayah.ayahNumber);
                const rootPreview = Array.from(
                  new Set(words.map((word) => word.root).filter(Boolean))
                ).slice(0, 4) as string[];

                return (
                  <motion.article
                    key={ayah.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "ayah-card group",
                      selected?.ayah.ayahNumber === ayah.ayahNumber &&
                        "border-primary/30 shadow-[0_22px_50px_rgba(44,93,71,0.12)]"
                    )}
                  >
                    <div className="flex flex-col gap-4 border-b border-border/60 pb-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="ayah-medallion">
                          {formatArabicNumber(ayah.ayahNumber)}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                            Ayah {ayah.ayahNumber}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Click a word to inspect morphology and verse analysis.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {analysis ? (
                          <Badge className="border-emerald-700/20 bg-emerald-100 px-3 py-1 text-emerald-900 hover:bg-emerald-100">
                            RCQI ready
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="px-3 py-1">
                            RCQI not cached
                          </Badge>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onGenerateAyahAnalysis(ayah)}
                          disabled={isAnalysisLoading}
                          className="rounded-full border-primary/20 bg-background/80 px-4"
                        >
                          {isAnalysisLoading ? "Analyzing..." : "Analyze ayah"}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-5 arabic-text text-[2rem] leading-[2.55] text-right text-foreground md:text-[2.3rem]">
                      {words.map((word, wordIndex) => {
                        const isSelected =
                          selected?.ayah.ayahNumber === ayah.ayahNumber &&
                          selected.word.position === word.position;
                        const hasRootCard = !!findRootCard(word, analysis);

                        return (
                          <span key={`${ayah.id}-${word.position}`} className="inline-block">
                            <motion.button
                              type="button"
                              onClick={() => {
                                setSelected({ ayah, word });
                                void onWordFocus(ayah);
                              }}
                              className={cn(
                                "word-interactive",
                                hasRootCard && "word-has-analysis",
                                isSelected && "word-selected"
                              )}
                              whileHover={{ y: -2, scale: 1.015 }}
                              whileTap={{ scale: 0.985 }}
                            >
                              {word.token}
                            </motion.button>
                            {wordIndex < words.length - 1 && " "}
                          </span>
                        );
                      })}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      {isWordsLoading && (
                        <Badge variant="outline" className="px-3 py-1">
                          Loading word morphology...
                        </Badge>
                      )}
                      {isAnalysisLoading && (
                        <Badge variant="outline" className="px-3 py-1">
                          Loading RCQI analysis...
                        </Badge>
                      )}
                      {!isWordsLoading &&
                        rootPreview.map((root) => (
                          <Badge
                            key={`${ayah.id}-${root}`}
                            className="border-primary/20 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10"
                          >
                            Root: {root}
                          </Badge>
                        ))}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>

      <AnimatePresence mode="wait">
        {selected && selectedWord ? (
          <WordDetailPanel
            key={`${selected.ayah.id}-${selectedWord.position}`}
            word={selectedWord}
            ayahNumber={selected.ayah.ayahNumber}
            surahName={surah?.nameEnglish}
            rootCard={selectedRootCard}
            analysis={selectedAnalysis}
            isWordDataLoading={loadingWordAyahs.includes(selected.ayah.ayahNumber)}
            isAnalysisLoading={loadingAnalysisAyahs.includes(selected.ayah.ayahNumber)}
            onAnalyzeAyah={() => onGenerateAyahAnalysis(selected.ayah)}
            onClose={() => setSelected(null)}
          />
        ) : (
          <motion.aside
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            className="hidden rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-[0_20px_60px_rgba(69,54,27,0.08)] xl:flex xl:flex-col xl:justify-between"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
                Word Lens
              </p>
              <h3 className="mt-3 font-display text-3xl text-primary">
                Click into the text
              </h3>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Every word in the reader is interactive. Selecting one opens
                morphology, root information when available, and ayah-level RCQI
                output for the verse it belongs to.
              </p>
            </div>

            <div className="rounded-[24px] border border-primary/20 bg-primary/5 p-5">
              <p className="font-display text-2xl text-primary">What you get</p>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>Word form, lemma, root, and part of speech</li>
                <li>RCQI status per ayah instead of first-ayah-only state</li>
                <li>Inline ayah analysis generation when no cache exists</li>
              </ul>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
