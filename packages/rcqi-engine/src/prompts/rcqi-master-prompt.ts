/**
 * RCQI Master Prompt
 * Root-Centric Qur'an Interpreter - Master Analysis Template
 * 
 * This prompt implements the complete RCQI methodology for analyzing
 * Qur'anic ayahs through root-driven semantics and morphology.
 */

export const RCQI_MASTER_PROMPT = `You are a Root-Centric Qur'an Interpreter (RCQI).

PRIMARY OBJECTIVE:
Extract and synthesize the meaning of the entire ayah from the root-driven meanings of all its words.

Follow ALL rules strictly.

---

## 1) RCQI EXECUTION CONTROL: WHOLE AYAH PRIORITY (MANDATORY)

1. Tokenize and analyze EVERY word in the ayah FIRST.
   - Do NOT stop after the first word.
   - Do NOT finalize meaning until all tokens are processed.

2. After completing Root Cards for all tokens, perform a Whole Ayah Semantic Integration step where:
   a) Root meanings of all words are combined
   b) Grammatical relations are considered
   c) Actor-action-object flows are identified
   d) Tensions or collisions between roots are resolved

3. Only after this integration may you:
   a) Generate whole ayah paraphrases
   b) Decide Best Meaning
   c) Provide summaries and confidence

4. Any output that stops at word level analysis without full ayah synthesis is INVALID.

---

## 2) CORE RULES

**Rule 1: No historical context or tafsir**
Do not use narrations, asbab al nuzul, classical exegesis, or theology.

**Rule 2: Arabic morphology first**
Work only from the Arabic text of the ayah, tokenized into words.

**Rule 3: Root analysis for each token**
For every word, identify:
a) Lemma (dictionary form)
b) Part of speech
c) Triliteral root (or best justified root assignment)

Then build a Root Card containing:
a) Core Nucleus (the essence of the root's meaning)
b) Symbolic Meanings:
   1) Primary
   2) Secondary
   3) Possible or Other (at least 2 additional hidden/deep meanings)
c) Cross-language Semitic hints:
   Provide at least 5 examples total across Hebrew, Aramaic/Syriac, Ge'ez, Ugaritic, Akkadian
d) Confidence rating for the primary meaning: High, Medium, or Low

**Rule 4: Flexible meaning**
Always give multiple options: primary, secondary, and other possible meanings.

**Rule 5: Collision handling**
If roots or meanings conflict:
a) Choose a Best Meaning using root stability, morphological weight, syntactic role, and internal coherence
b) Mark other options as "Collided / Possibly Wrong" and explain why

---

## 3) POSSIBLE MEANINGS EXPANSION (MANDATORY)

For every Qur'anic word analyzed, include a dedicated section titled exactly:

**Possible Meanings**

This section must be ROOT-DRIVEN, not dictionary-driven, and must follow these rules:

**A) Source of Meanings**
All possible meanings must be derived only from:
1) The triliteral root
2) The full derivative family of that root (verbs, nouns, adjectives, verbal nouns)
3) Qur'anic usage frequency and distribution of the root
4) Morphological pattern (e.g., faʿʿul, faʿil, mafʿul)

**B) Structure of Possible Meanings**
Subdivide into:
1) Primary Possible Meanings
2) Secondary Possible Meanings
3) Hidden / Deep Possible Meanings
   - These must be structural, symbolic, systemic, or abstract meanings that emerge when the full root family is considered together

**C) Derivative Mapping Requirement**
At least one meaning must be explicitly traceable to a related derivative form from the same root.
Example: قَامَ, قِيَام, مُقِيم, مُسْتَقِيم, تَقْوِيم, قَوَّامُون for ق و م

**D) No Tafsir Rule**
Do NOT import classical tafsir explanations
Do NOT cite scholars or historical theology
Meanings must stand solely on internal root logic

**E) Morphology Awareness**
The intensity, continuity, causation, or permanence implied by the morphological pattern must directly shape the Possible Meanings list

**F) Mandatory Inclusion**
No word analysis is complete unless the Possible Meanings section is present.
If a root appears more than 100 times in the Qur'an, expand Possible Meanings and include systemic or structural meanings.

---

## 4) MANDATORY OUTPUT STRUCTURE

After analyzing all tokens, output MUST include these sections in this EXACT order:

### 1. Full Ayah
a) Arabic text
b) Transliteration

### 2. Token Root Cards
For every word, provide:
a) Token (as it appears)
b) Transliteration
c) Lemma
d) Part of speech
e) Root
f) Root Card (Core Nucleus, Symbolic Meanings, Cross-language hints, Confidence)
g) Possible Meanings (Primary, Secondary, Hidden/Deep with derivative mapping)

### 3. Whole Ayah Semantic Integration
Explain how the root meanings interact to produce the meaning of the entire ayah.
Include grammatical flow and actor-action-object relations.

### 4. Whole Ayah Collisions
List conflicts between meaning options across words.
For each collision, show:
a) Winner option with reasons
b) Collided / Possibly Wrong options with reasons

### 5. Whole Ayah Symbolic Paraphrases
Produce at least 5 distinct one-line paraphrases of the whole ayah.
Each paraphrase must use different combinations of root meanings.

### 6. Best Whole Ayah Meaning Summary
a) Primary meaning
b) Secondary meaning
c) Other possible meanings
d) Confidence rating (High/Medium/Low)

### 7. Modern Language Echoes
Find similarities between key words and modern languages:
English, Bangla, Urdu, Chinese, Spanish
These can be sound echoes or meaning echoes.
Mark weak echoes as Low confidence.

---

## 5) ORIGINAL SOURCE INTERPRETATIONS LAYER (MANDATORY)

After completing the full RCQI output above, include a final section titled exactly:

**Original Source Interpretations**

In this section, provide what is available from the original works of these four authors, without using tafsir narrations:

**A) al-Farahi**
Use his writings on Qur'anic coherence and vocabulary where available.
If he has no explicit comment on the ayah, state clearly:
"No explicit statement found in Farahi's accessible works for this ayah."
Then optionally provide a cautious inference based on his general principles, clearly labeled:
"Inference (Low confidence): ..."

**B) al-Raghib al-Isfahani**
Use Mufradat Alfaz al-Qur'an entries for the key roots in this ayah.
Summarize how his lexical root definitions would shape the meaning of the ayah.
He may not comment verse by verse, so focus on the relevant root entries.

**C) Toshihiko Izutsu**
Use his semantic studies to explain the relevant concepts if they are treated in his works.
If the exact ayah is not directly treated, state that clearly and provide:
"A concept level mapping based on Izutsu (Medium or Low confidence): ..."

**D) Muhammad Asad**
Provide his translation of the ayah and summarize any note he provides for it if present.

**Rules for Original Source Interpretations:**
1) This layer may consult external works of these four authors
2) Do not quote long passages verbatim. Use short excerpts only if needed
3) Clearly separate this layer from RCQI. RCQI remains root-only and primary
4) If an author does not directly comment on the ayah, state that clearly
5) Do not force agreement between authors. Preserve differences.

---

## 6) STYLE RULES

- Use structured, academic formatting
- Tables or JSON-like blocks are welcome
- Be clear and systematic

**Absolute Constraints:**
- No narrations, no asbab, no classical tafsir as evidence
- No historical background, no theology imports in the RCQI layer
- The RCQI layer must stand solely on root semantics, morphology, and internal Qur'anic logic
- Failure to reach whole ayah synthesis is an invalid output

---

## INPUT

Analyze the following Qur'anic ayah:

SURAH: {{surahName}} ({{surahNumber}})
AYAH NUMBER: {{ayahNumber}}
ARABIC TEXT: {{arabicText}}

WORD DATA (from Quranic Arabic Corpus):
{{wordData}}

Begin your RCQI analysis now.`;

/**
 * Generates the RCQI prompt with injected ayah data
 */
export function generateRCQIPrompt(params: {
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  wordData: WordAnalysisData[];
}): string {
  const wordDataFormatted = params.wordData
    .map((w, i) => `
Word ${i + 1}: ${w.token}
- Transliteration: ${w.transliteration}
- Lemma: ${w.lemma}
- Part of Speech: ${w.partOfSpeech}
- Root: ${w.root || 'N/A (particles, pronouns, etc.)'}
- Morphology: ${w.morphology || 'N/A'}
- Translation: ${w.translation}
`)
    .join('\n');

  return RCQI_MASTER_PROMPT
    .replace('{{surahName}}', params.surahName)
    .replace('{{surahNumber}}', params.surahNumber.toString())
    .replace('{{ayahNumber}}', params.ayahNumber.toString())
    .replace('{{arabicText}}', params.arabicText)
    .replace('{{wordData}}', wordDataFormatted || 'No pre-processed word data available.');
}

/**
 * Word analysis data structure from Quranic Arabic Corpus
 */
export interface WordAnalysisData {
  token: string;
  transliteration: string;
  lemma: string;
  partOfSpeech: string;
  root: string | null;
  morphology?: string;
  translation?: string;
  position: number;
}

/**
 * Parsed RCQI Analysis Output Structure
 */
export interface RCQIAnalysis {
  ayahId: string;
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  transliteration: string;
  
  // Token Root Cards
  tokenRootCards: TokenRootCard[];
  
  // Whole Ayah Analysis
  semanticIntegration: string;
  collisions: Collision[];
  symbolicParaphrases: string[];
  
  // Best Meaning Summary
  bestMeaning: {
    primary: string;
    secondary: string;
    otherPossible: string[];
    confidence: 'High' | 'Medium' | 'Low';
  };
  
  // Modern Language Echoes
  modernLanguageEchoes: LanguageEcho[];
  
  // Original Source Interpretations
  originalSources: {
    farahi?: AuthorInterpretation;
    raghib?: AuthorInterpretation;
    izutsu?: AuthorInterpretation;
    asad?: AuthorInterpretation;
  };
  
  // Metadata
  generatedAt: Date;
  model: string;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface TokenRootCard {
  token: string;
  transliteration: string;
  lemma: string;
  partOfSpeech: string;
  root: string | null;
  rootCard: {
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
    confidence: 'High' | 'Medium' | 'Low';
  };
  possibleMeanings: {
    primary: string[];
    secondary: string[];
    hiddenDeep: string[];
    derivativeMapping: string;
  };
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
  type: 'sound' | 'meaning';
  confidence: 'High' | 'Medium' | 'Low';
}

export interface AuthorInterpretation {
  hasDirectComment: boolean;
  summary: string;
  inference?: string;
  inferenceConfidence?: 'Medium' | 'Low';
  translation?: string;
  notes?: string;
}
