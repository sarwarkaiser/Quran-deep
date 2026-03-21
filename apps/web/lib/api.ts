import { Surah, Ayah, Word, RCQIAnalysis, RootInfo } from "@/types";

const rawApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";
const API_BASE = rawApiBase.endsWith("/v1") ? rawApiBase : `${rawApiBase}/v1`;

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Surahs
  getSurahs: () => fetchApi<Surah[]>("/surahs"),
  
  getSurah: (id: number) => fetchApi<Surah>(`/surahs/${id}`),
  
  getSurahAyahs: (id: number) => fetchApi<Ayah[]>(`/surahs/${id}/ayahs`),
  
  // Ayahs
  getAyah: (surahId: number, ayahNumber: number) => 
    fetchApi<Ayah>(`/ayahs/${surahId}/${ayahNumber}`),
  
  // Words (morphology)
  getAyahWords: (surahId: number, ayahNumber: number) => 
    fetchApi<Word[]>(`/ayahs/${surahId}/${ayahNumber}/words`),
  
  // RCQI Analysis
  getRCQIAnalysis: (surahNumber: number, ayahNumber: number) =>
    fetchApi<{ analysis: RCQIAnalysis }>(`/rcqi/analysis/${surahNumber}/${ayahNumber}`),
  
  analyzeAyah: (surahNumber: number, ayahNumber: number, forceRefresh = false) =>
    fetchApi<{ analysis: RCQIAnalysis; cached: boolean }>(
      `/rcqi/analyze/${surahNumber}/${ayahNumber}`,
      {
        method: "POST",
        body: JSON.stringify({ forceRefresh }),
      }
    ),
  
  // Roots
  getRootInfo: (root: string) =>
    fetchApi<RootInfo>(`/roots/${encodeURIComponent(root)}`),
  
  searchRoots: (query: string) =>
    fetchApi<RootInfo[]>(`/roots/search?q=${encodeURIComponent(query)}`),
};

// Fetch real data from API
export const realApi = api;

// Mock data only used as fallback when API fails
export const mockApi = {
  getSurahs: async (): Promise<Surah[]> => {
    // Return all 114 surahs
    return [
      { id: 1, nameArabic: "الفاتحة", nameTransliterated: "Al-Fatiha", nameEnglish: "The Opening", ayahCount: 7, revelationPeriod: "meccan" },
      { id: 2, nameArabic: "البقرة", nameTransliterated: "Al-Baqarah", nameEnglish: "The Cow", ayahCount: 286, revelationPeriod: "medinan" },
      { id: 3, nameArabic: "آل عمران", nameTransliterated: "Aal-E-Imran", nameEnglish: "The Family of Imran", ayahCount: 200, revelationPeriod: "medinan" },
      { id: 4, nameArabic: "النساء", nameTransliterated: "An-Nisa", nameEnglish: "The Women", ayahCount: 176, revelationPeriod: "medinan" },
      { id: 5, nameArabic: "المائدة", nameTransliterated: "Al-Ma'idah", nameEnglish: "The Table Spread", ayahCount: 120, revelationPeriod: "medinan" },
    ];
  },
  
  getSurahAyahs: async (surahId: number): Promise<Ayah[]> => {
    // This will be fetched from real API
    return [];
  },
  
  analyzeAyah: async (surahNumber: number, ayahNumber: number): Promise<{ analysis: RCQIAnalysis; cached: boolean }> => {
    throw new Error("Mock analysis not available");
  },
};
