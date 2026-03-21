"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Search, Star } from "lucide-react";
import { Surah } from "@/types";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";

interface SurahListProps {
  surahs: Surah[];
  selectedSurah?: number;
  onSelectSurah: (surah: Surah) => void;
}

export function SurahList({
  surahs,
  selectedSurah,
  onSelectSurah,
}: SurahListProps) {
  const [search, setSearch] = useState("");

  const filteredSurahs = surahs.filter(
    (surah) =>
      surah.nameEnglish.toLowerCase().includes(search.toLowerCase()) ||
      surah.nameTransliterated.toLowerCase().includes(search.toLowerCase()) ||
      surah.nameArabic.includes(search)
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-border/70 bg-card/90 shadow-[0_20px_60px_rgba(69,54,27,0.08)]">
      <div className="border-b border-border/60 px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
              Navigator
            </p>
            <h2 className="mt-2 font-display text-3xl text-primary">Surahs</h2>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
        </div>

        <div className="mt-4 rounded-[22px] border border-border/70 bg-background/70 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by English, transliteration, or Arabic"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 rounded-full border-none bg-transparent pl-9 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="h-4 w-4 text-primary" />
          <span>{filteredSurahs.length} surahs in view</span>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 px-3 py-3">
          {filteredSurahs.map((surah, index) => (
            <motion.button
              key={surah.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => onSelectSurah(surah)}
              className={cn(
                "w-full rounded-[22px] border p-4 text-left transition-all duration-200",
                selectedSurah === surah.id
                  ? "border-primary/30 bg-primary/10 shadow-[0_12px_30px_rgba(44,93,71,0.12)]"
                  : "border-transparent bg-background/60 hover:border-border hover:bg-background"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-card font-display text-lg text-primary">
                  {surah.id}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-2xl leading-none text-primary">
                        {surah.nameEnglish}
                      </p>
                      <p className="mt-2 truncate text-sm text-muted-foreground">
                        {surah.nameTransliterated}
                      </p>
                    </div>
                    <p className="font-arabic text-2xl text-foreground/80">
                      {surah.nameArabic}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline" className="px-3 py-1">
                      {surah.ayahCount} ayahs
                    </Badge>
                    <Badge
                      className={cn(
                        "px-3 py-1 capitalize hover:bg-transparent",
                        surah.revelationPeriod === "meccan"
                          ? "border-sky-700/20 bg-sky-100 text-sky-900"
                          : "border-emerald-700/20 bg-emerald-100 text-emerald-900"
                      )}
                    >
                      {surah.revelationPeriod}
                    </Badge>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
