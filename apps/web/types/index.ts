export interface Surah {
  id: number;
  nameArabic: string;
  nameTransliterated: string;
  nameEnglish: string;
  ayahCount: number;
  revelationPeriod: "meccan" | "medinan";
}

export interface Ayah {
  id: number;
  surahId: number;
  ayahNumber: number;
  textArabic: string;
  textUthmani?: string | null;
  textIndopak?: string | null;
  textSimplified?: string | null;
  juz?: number | null;
  hizb?: number | null;
  page?: number | null;
  sajda?: boolean | null;
}

export interface Word {
  id?: number;
  ayahId: number;
  position: number;
  token: string;
  transliteration?: string | null;
  lemma?: string | null;
  root?: string | null;
  partOfSpeech?: string | null;
  morphology?: string | null;
  features?: WordFeatures | null;
  translation?: string | null;
}

export interface WordFeatures {
  person?: string;
  gender?: string;
  number?: string;
  tense?: string;
  voice?: string;
  case?: string;
  definiteness?: string;
  segments?: WordSegment[];
}

export interface WordSegment {
  location: string;
  form: string;
  tag: string;
  type?: "PREFIX" | "STEM" | "SUFFIX";
  pos?: string;
}

export interface RootCard {
  coreNucleus: string;
  symbolicMeanings: {
    primary: string;
    secondary: string;
    other: string[];
  };
  crossLanguageHints: {
    hebrew?: string;
    aramaic?: string;
    syriac?: string;
    geez?: string;
    ugaritic?: string;
    akkadian?: string;
  };
  confidence: "High" | "Medium" | "Low";
}

export interface PossibleMeanings {
  primary: string[];
  secondary: string[];
  hiddenDeep: string[];
  derivativeMapping: string;
}

export interface TokenRootCard {
  token: string;
  transliteration: string;
  lemma: string;
  partOfSpeech: string;
  root: string | null;
  rootCard: RootCard;
  possibleMeanings: PossibleMeanings;
}

export interface RCQIAnalysis {
  ayahId: string;
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  transliteration: string;
  tokenRootCards: TokenRootCard[];
  semanticIntegration: string;
  collisions: Collision[];
  symbolicParaphrases: string[];
  bestMeaning: {
    primary: string;
    secondary: string;
    otherPossible: string[];
    confidence: "High" | "Medium" | "Low";
  };
  modernLanguageEchoes: LanguageEcho[];
  originalSources: {
    farahi?: AuthorInterpretation;
    raghib?: AuthorInterpretation;
    izutsu?: AuthorInterpretation;
    asad?: AuthorInterpretation;
  };
  methodology: {
    promptVersion: string;
    analysisVersion: string;
    wholeAyahPriorityEnforced: boolean;
    tokenCoverage: {
      expected: number;
      actual: number;
    };
    sourceGrounding: {
      totalHits: number;
      authorsWithHits: number;
      byAuthor: {
        farahi: number;
        raghib: number;
        izutsu: number;
        asad: number;
      };
      citations: string[];
    };
  };
  validation: {
    valid: boolean;
    issues: string[];
  };
  generatedAt: string;
  model: string;
}

export interface Collision {
  description: string;
  winner: {
    meaning: string;
    reasons: string[];
  };
  collidedOptions: {
    meaning: string;
    reasons: string[];
  }[];
}

export interface LanguageEcho {
  word: string;
  language: string;
  echo: string;
  type: "sound" | "meaning";
  confidence: "High" | "Medium" | "Low";
}

export interface AuthorInterpretation {
  hasDirectComment: boolean;
  summary: string;
  inference?: string;
  inferenceConfidence?: "Medium" | "Low";
  translation?: string;
  notes?: string;
}

export interface RootInfo {
  root: string;
  occurrences: number;
  coreMeaning: string;
  semanticField: string;
  derivatives: string[];
}
