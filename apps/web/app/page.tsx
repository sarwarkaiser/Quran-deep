"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  Layers3,
  Menu,
  Sparkles,
  Waves,
  X,
} from "lucide-react";
import { Ayah, RCQIAnalysis, Surah, Word } from "@/types";
import { realApi as api } from "@/lib/api";
import { SurahList } from "@/components/SurahList";
import { QuranReader } from "@/components/QuranReader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type WordMap = Record<number, Word[]>;
type AnalysisMap = Record<number, RCQIAnalysis | null>;

export default function Home() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [wordsByAyah, setWordsByAyah] = useState<WordMap>({});
  const [analysesByAyah, setAnalysesByAyah] = useState<AnalysisMap>({});
  const [loadingWordAyahs, setLoadingWordAyahs] = useState<number[]>([]);
  const [loadingAnalysisAyahs, setLoadingAnalysisAyahs] = useState<number[]>([]);
  const [isLoadingSurahs, setIsLoadingSurahs] = useState(true);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const wordsByAyahRef = useRef<WordMap>({});
  const analysesByAyahRef = useRef<AnalysisMap>({});

  useEffect(() => {
    wordsByAyahRef.current = wordsByAyah;
  }, [wordsByAyah]);

  useEffect(() => {
    analysesByAyahRef.current = analysesByAyah;
  }, [analysesByAyah]);

  const setAyahLoadingState = (
    setter: Dispatch<SetStateAction<number[]>>,
    ayahNumber: number,
    isLoading: boolean
  ) => {
    setter((current) => {
      if (isLoading) {
        return current.includes(ayahNumber) ? current : [...current, ayahNumber];
      }

      return current.filter((value) => value !== ayahNumber);
    });
  };

  const ensureAyahWords = useCallback(
    async (ayah: Ayah) => {
      const cachedWords = wordsByAyahRef.current[ayah.ayahNumber];
      if (cachedWords) {
        return cachedWords;
      }

      try {
        setAyahLoadingState(setLoadingWordAyahs, ayah.ayahNumber, true);
        const words = await api.getAyahWords(ayah.surahId, ayah.ayahNumber);
        setWordsByAyah((current) => ({
          ...current,
          [ayah.ayahNumber]: words,
        }));
        return words;
      } catch (fetchError) {
        console.error(fetchError);
        return [];
      } finally {
        setAyahLoadingState(setLoadingWordAyahs, ayah.ayahNumber, false);
      }
    },
    []
  );

  const ensureCachedAnalysis = useCallback(
    async (ayah: Ayah) => {
      if (
        Object.prototype.hasOwnProperty.call(
          analysesByAyahRef.current,
          ayah.ayahNumber
        )
      ) {
        return analysesByAyahRef.current[ayah.ayahNumber];
      }

      try {
        setAyahLoadingState(setLoadingAnalysisAyahs, ayah.ayahNumber, true);
        const response = await api.getRCQIAnalysis(ayah.surahId, ayah.ayahNumber);
        setAnalysesByAyah((current) => ({
          ...current,
          [ayah.ayahNumber]: response.analysis,
        }));
        return response.analysis;
      } catch (fetchError) {
        setAnalysesByAyah((current) => ({
          ...current,
          [ayah.ayahNumber]: null,
        }));
        return null;
      } finally {
        setAyahLoadingState(setLoadingAnalysisAyahs, ayah.ayahNumber, false);
      }
    },
    []
  );

  const handleGenerateAnalysis = useCallback(async (ayah: Ayah) => {
    try {
      setAnalysisError(null);
      setAyahLoadingState(setLoadingAnalysisAyahs, ayah.ayahNumber, true);
      const response = await api.analyzeAyah(ayah.surahId, ayah.ayahNumber);
      setAnalysesByAyah((current) => ({
        ...current,
        [ayah.ayahNumber]: response.analysis,
      }));
    } catch (generateError: any) {
      console.error(generateError);
      setAnalysisError(
        generateError?.message || "Unable to generate RCQI analysis for this ayah."
      );
    } finally {
      setAyahLoadingState(setLoadingAnalysisAyahs, ayah.ayahNumber, false);
    }
  }, []);

  const handleWordFocus = useCallback(
    async (ayah: Ayah) => {
      await Promise.all([ensureAyahWords(ayah), ensureCachedAnalysis(ayah)]);
    },
    [ensureAyahWords, ensureCachedAnalysis]
  );

  useEffect(() => {
    const loadSurahs = async () => {
      try {
        setIsLoadingSurahs(true);
        const data = await api.getSurahs();
        setSurahs(data);
        if (data.length > 0) {
          setSelectedSurah(data[0]);
        }
      } catch (loadError) {
        console.error(loadError);
        setError("Failed to load surahs.");
      } finally {
        setIsLoadingSurahs(false);
      }
    };

    loadSurahs();
  }, []);

  useEffect(() => {
    if (!selectedSurah) {
      return;
    }

    const loadAyahs = async () => {
      try {
        setIsLoadingAyahs(true);
        setError(null);
        setAnalysisError(null);
        setWordsByAyah({});
        setAnalysesByAyah({});
        wordsByAyahRef.current = {};
        analysesByAyahRef.current = {};
        setLoadingWordAyahs([]);
        setLoadingAnalysisAyahs([]);

        const data = await api.getSurahAyahs(selectedSurah.id);
        setAyahs(data);

        if (data.length > 0) {
          const previewAyahs = data.slice(0, Math.min(data.length, 4));
          void Promise.all(previewAyahs.map((ayah) => ensureAyahWords(ayah)));
          void ensureCachedAnalysis(data[0]);
        }
      } catch (loadError) {
        console.error(loadError);
        setError("Failed to load ayahs.");
      } finally {
        setIsLoadingAyahs(false);
      }
    };

    loadAyahs();
  }, [selectedSurah, ensureAyahWords, ensureCachedAnalysis]);

  const handleSelectSurah = (surah: Surah) => {
    setSelectedSurah(surah);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setShowSidebar(false);
    }
  };

  const analyzedAyahCount = Object.values(analysesByAyah).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(213,176,103,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(44,93,71,0.14),transparent_32%),linear-gradient(180deg,rgba(255,250,240,0.8),rgba(247,240,226,0.96))]" />

      <div className="relative flex min-h-screen flex-col">
        <header className="glass border-b border-border/70">
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar((current) => !current)}
                className="lg:hidden"
              >
                {showSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-[0_10px_30px_rgba(44,93,71,0.12)]">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="font-display text-2xl leading-none text-primary">
                  Quran Deep
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Root-Centric Reader
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <div className="reader-pill">
                <Layers3 className="h-4 w-4 text-primary" />
                <span>{selectedSurah?.ayahCount ?? 0} ayahs</span>
              </div>
              <div className="reader-pill">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>{analyzedAyahCount} analyses cached</span>
              </div>
              <div className="reader-pill">
                <Waves className="h-4 w-4 text-primary" />
                <span>Word-by-word exploration</span>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1600px] flex-1 gap-4 px-4 py-4 md:px-6 lg:px-8">
          <AnimatePresence initial={false}>
            {showSidebar && (
              <motion.aside
                initial={{ x: -24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -24, opacity: 0 }}
                className="absolute inset-y-0 left-0 z-20 w-[320px] px-4 pt-[90px] lg:static lg:w-[320px] lg:px-0 lg:pt-0"
              >
                <SurahList
                  surahs={surahs}
                  selectedSurah={selectedSurah?.id}
                  onSelectSurah={handleSelectSurah}
                />
              </motion.aside>
            )}
          </AnimatePresence>

          <main className="min-w-0 flex-1">
            <section className="mb-4 rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-[0_20px_60px_rgba(69,54,27,0.08)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
                    Current Surah
                  </p>
                  <div className="mt-2 flex flex-wrap items-end gap-3">
                    <h1 className="font-display text-4xl leading-none text-primary md:text-5xl">
                      {selectedSurah?.nameEnglish ?? "Loading..."}
                    </h1>
                    {selectedSurah && (
                      <span className="font-arabic text-3xl text-foreground/80">
                        {selectedSurah.nameArabic}
                      </span>
                    )}
                  </div>
                  {selectedSurah && (
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                      Browse the Arabic text word by word. Clicking any word opens
                      morphology immediately and loads ayah-level RCQI analysis for
                      that specific verse when available.
                    </p>
                  )}
                </div>

                {selectedSurah && (
                  <div className="flex flex-wrap gap-2">
                    <Badge className="border-primary/20 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                      {selectedSurah.nameTransliterated}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">
                      {selectedSurah.revelationPeriod}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">
                      {selectedSurah.ayahCount} ayahs
                    </Badge>
                  </div>
                )}
              </div>
            </section>

            {isLoadingSurahs || isLoadingAyahs ? (
              <div className="flex h-[70vh] items-center justify-center rounded-[28px] border border-border/70 bg-card/80">
                <div className="text-center">
                  <div className="loading-dots mb-4">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                    Loading Quran reader
                  </p>
                </div>
              </div>
            ) : (
              <QuranReader
                ayahs={ayahs}
                surah={selectedSurah}
                wordsByAyah={wordsByAyah}
                analysesByAyah={analysesByAyah}
                loadingWordAyahs={loadingWordAyahs}
                loadingAnalysisAyahs={loadingAnalysisAyahs}
                onWordFocus={handleWordFocus}
                onGenerateAyahAnalysis={handleGenerateAnalysis}
              />
            )}
          </main>
        </div>

        <AnimatePresence>
          {analysisError && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="fixed bottom-4 right-4 z-50 max-w-md rounded-2xl border border-amber-300/50 bg-amber-500 px-4 py-3 text-white shadow-2xl"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium">{analysisError}</p>
                  <button
                    onClick={() => setAnalysisError(null)}
                    className="mt-2 text-sm underline underline-offset-4"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-destructive/20 bg-destructive px-4 py-3 text-destructive-foreground shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-sm underline underline-offset-4"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
