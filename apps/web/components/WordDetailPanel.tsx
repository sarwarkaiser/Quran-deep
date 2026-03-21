"use client";

import { motion } from "framer-motion";
import { BookMarked, Languages, Sparkles, TreePine, X } from "lucide-react";
import { RCQIAnalysis, TokenRootCard, Word } from "@/types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

interface WordDetailPanelProps {
  word: Word;
  rootCard?: TokenRootCard;
  analysis?: RCQIAnalysis | null;
  ayahNumber: number;
  surahName?: string;
  isWordDataLoading?: boolean;
  isAnalysisLoading?: boolean;
  onAnalyzeAyah: () => void;
  onClose: () => void;
}

function summarizeAnalysis(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= 420) {
    return compact;
  }

  return `${compact.slice(0, 420).trim()}...`;
}

export function WordDetailPanel({
  word,
  rootCard,
  analysis,
  ayahNumber,
  surahName,
  isWordDataLoading,
  isAnalysisLoading,
  onAnalyzeAyah,
  onClose,
}: WordDetailPanelProps) {
  const featureEntries = Object.entries(word.features ?? {}).filter(
    ([key, value]) =>
      value &&
      key !== "segments" &&
      key !== "location" &&
      key !== "form" &&
      key !== "tag"
  );

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="min-h-0 rounded-[28px] border border-border/70 bg-card/90 shadow-[0_20px_60px_rgba(69,54,27,0.12)]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-5">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Word Focus
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <h3 className="font-arabic text-4xl text-foreground">{word.token}</h3>
            <div className="pb-1">
              <p className="font-display text-2xl text-primary">
                {word.transliteration || rootCard?.transliteration || "Arabic token"}
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Ayah {ayahNumber} {surahName ? `• ${surahName}` : ""}
              </p>
            </div>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-14rem)]">
        <div className="space-y-6 px-5 py-5">
          <section className="rounded-[24px] border border-primary/20 bg-primary/5 p-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="border-primary/20 bg-background px-3 py-1 text-primary hover:bg-background">
                Position {word.position}
              </Badge>
              {(word.partOfSpeech || rootCard?.partOfSpeech) && (
                <Badge variant="outline" className="px-3 py-1">
                  {word.partOfSpeech || rootCard?.partOfSpeech}
                </Badge>
              )}
              {(word.root || rootCard?.root) && (
                <Badge variant="outline" className="px-3 py-1">
                  Root {word.root || rootCard?.root}
                </Badge>
              )}
              {(word.lemma || rootCard?.lemma) && (
                <Badge variant="outline" className="px-3 py-1">
                  Lemma {word.lemma || rootCard?.lemma}
                </Badge>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={onAnalyzeAyah}
                disabled={isAnalysisLoading}
                className="rounded-full px-4"
              >
                {isAnalysisLoading ? "Analyzing..." : "Analyze this ayah"}
              </Button>
              {isWordDataLoading && (
                <Badge variant="outline" className="px-3 py-1">
                  Loading word metadata...
                </Badge>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <TreePine className="h-4 w-4 text-primary" />
              <h4 className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                Morphology
              </h4>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Transliteration
                </p>
                <p className="mt-2 font-display text-2xl text-primary">
                  {word.transliteration || rootCard?.transliteration || "Unavailable"}
                </p>
              </div>

              <div className="rounded-[22px] border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Root
                </p>
                <p className="mt-2 font-arabic text-3xl text-foreground">
                  {word.root || rootCard?.root || "—"}
                </p>
              </div>
            </div>

            {featureEntries.length > 0 && (
              <div className="rounded-[22px] border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Feature tags
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {featureEntries.map(([key, value]) => (
                    <Badge key={key} variant="outline" className="px-3 py-1 capitalize">
                      {key}: {String(value)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </section>

          {rootCard && (
            <section className="space-y-4 rounded-[24px] border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                  Root Semantics
                </h4>
              </div>

              <div className="rounded-[20px] bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Core nucleus
                </p>
                <p className="mt-2 leading-7 text-foreground">
                  {rootCard.rootCard.coreNucleus}
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[20px] border border-primary/20 bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-primary">
                    Primary meaning
                  </p>
                  <p className="mt-2 text-foreground">
                    {rootCard.rootCard.symbolicMeanings.primary}
                  </p>
                </div>

                <div className="rounded-[20px] border border-border/70 bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Secondary meaning
                  </p>
                  <p className="mt-2 text-foreground">
                    {rootCard.rootCard.symbolicMeanings.secondary}
                  </p>
                </div>
              </div>

              {(rootCard.possibleMeanings.primary.length > 0 ||
                rootCard.possibleMeanings.secondary.length > 0) && (
                <div className="rounded-[20px] border border-border/70 bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Possible meanings
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-foreground">
                    {rootCard.possibleMeanings.primary.slice(0, 2).map((meaning) => (
                      <li key={meaning}>{meaning}</li>
                    ))}
                    {rootCard.possibleMeanings.secondary.slice(0, 2).map((meaning) => (
                      <li key={meaning}>{meaning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <Separator />

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-primary" />
              <h4 className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                Ayah RCQI
              </h4>
            </div>

            {analysis ? (
              <div className="space-y-3 rounded-[24px] border border-border/70 bg-background/70 p-4">
                <p className="text-sm leading-7 text-foreground">
                  {summarizeAnalysis(analysis.semanticIntegration)}
                </p>

                {analysis.symbolicParaphrases.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Symbolic paraphrases
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-foreground">
                      {analysis.symbolicParaphrases.slice(0, 3).map((paraphrase) => (
                        <li key={paraphrase}>{paraphrase}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-border bg-background/60 p-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  No cached RCQI analysis is attached to this ayah yet. Generate it
                  to see whole-ayah semantic integration and verse-level output
                  alongside this word.
                </p>
              </div>
            )}
          </section>

          {rootCard?.rootCard.crossLanguageHints && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-primary" />
                <h4 className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                  Cross-language hints
                </h4>
              </div>

              <div className="grid gap-3">
                {Object.entries(rootCard.rootCard.crossLanguageHints).map(([key, value]) =>
                  value ? (
                    <div
                      key={key}
                      className="rounded-[20px] border border-border/70 bg-background/70 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        {key}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
                    </div>
                  ) : null
                )}
              </div>
            </section>
          )}
        </div>
      </ScrollArea>
    </motion.aside>
  );
}
