export type SourceAuthor = 'farahi' | 'raghib' | 'izutsu' | 'asad';

export interface SourceCorpusEntry {
  id: string;
  author: SourceAuthor;
  scope: 'global' | 'surah' | 'ayah' | 'root' | 'concept';
  citation: string;
  summary: string;
  surahNumber?: number;
  ayahNumber?: number;
  roots?: string[];
  concepts?: string[];
  hasDirectComment?: boolean;
  inference?: string;
  inferenceConfidence?: 'Medium' | 'Low';
  translation?: string;
  notes?: string;
}

export const starterSourceCorpus: SourceCorpusEntry[] = [
  {
    id: 'farahi-nazm-principle',
    author: 'farahi',
    scope: 'global',
    citation: 'Hamid al-Din al-Farahi, nazm / coherence principles',
    summary:
      'Farahi reads Qur\'anic vocabulary through nazm: the local verse and surah order should control interpretation before outside narrative material is imported.',
    hasDirectComment: false,
    inference:
      'Inference (Low confidence): the verse should be synthesized by how its praise-language, divine naming, and lordship vocabulary cohere inside the surah.',
    inferenceConfidence: 'Low',
    notes:
      'Starter corpus principle entry. Extend with surah- or ayah-specific Farahi material as the local source pack grows.',
  },
  {
    id: 'raghib-hmd',
    author: 'raghib',
    scope: 'root',
    citation: 'al-Raghib al-Isfahani, Mufradat Alfaz al-Qur\'an, root h-m-d',
    summary:
      'Raghib frames hamd as praise grounded in recognized excellence and willing approval, not merely empty commendation.',
    roots: ['حمد'],
    hasDirectComment: false,
    inference:
      'Inference (Low confidence): where h-m-d appears, the verse likely points to praise anchored in perceived worth, not a flat formula.',
    inferenceConfidence: 'Low',
  },
  {
    id: 'raghib-rbb',
    author: 'raghib',
    scope: 'root',
    citation: 'al-Raghib al-Isfahani, Mufradat Alfaz al-Qur\'an, root r-b-b',
    summary:
      'Raghib treats rabb as nurturing governance that develops a thing stage by stage toward its fitting completion.',
    roots: ['ربب'],
    hasDirectComment: false,
    inference:
      'Inference (Low confidence): when rabb structures an ayah, sustained care and ordered development should remain in view.',
    inferenceConfidence: 'Low',
  },
  {
    id: 'raghib-alamin',
    author: 'raghib',
    scope: 'root',
    citation: 'al-Raghib al-Isfahani, Mufradat Alfaz al-Qur\'an, root ʿ-l-m / al-ʿalamin usage',
    summary:
      'For world / realm language built on ʿ-l-m, Raghib links created realms to signs through which their maker becomes known.',
    roots: ['علم'],
    hasDirectComment: false,
    inference:
      'Inference (Low confidence): al-ʿalamin can suggest ordered domains that disclose their source, not only a bare plural of creatures.',
    inferenceConfidence: 'Low',
  },
  {
    id: 'izutsu-hamd-value-language',
    author: 'izutsu',
    scope: 'concept',
    citation: 'Toshihiko Izutsu, semantic studies on Qur\'anic value-language',
    summary:
      'Izutsu treats praise-language as part of a relational semantic field in which recognition, value, and response are linked.',
    concepts: ['praise', 'hamd', 'value-language'],
    roots: ['حمد'],
    hasDirectComment: false,
    inference:
      'A concept level mapping based on Izutsu (Medium confidence): praise here belongs to a network of value-response terms rather than an isolated lexical item.',
    inferenceConfidence: 'Medium',
  },
  {
    id: 'izutsu-rabb-relation',
    author: 'izutsu',
    scope: 'concept',
    citation: 'Toshihiko Izutsu, relational semantics of divine lordship',
    summary:
      'Izutsu reads divine lordship as a relation of dependence, ordering, and sustaining governance rather than a mere title.',
    concepts: ['lordship', 'dependence', 'rabb'],
    roots: ['ربب'],
    hasDirectComment: false,
    inference:
      'A concept level mapping based on Izutsu (Medium confidence): rabb should be heard as an active relation between the source and the ordered world.',
    inferenceConfidence: 'Medium',
  },
  {
    id: 'asad-1-2',
    author: 'asad',
    scope: 'ayah',
    citation: 'Muhammad Asad, The Message of the Qur\'an, 1:2',
    summary:
      'Asad reads the verse as praise directed to God while foregrounding rabb as sustaining care over all realms of existence.',
    surahNumber: 1,
    ayahNumber: 2,
    hasDirectComment: true,
    translation:
      'Asad paraphrases the verse as praise belonging to God, the Sustainer of all the worlds.',
    notes:
      'Starter corpus ayah entry. Extend with note summaries for additional verses as the local source pack grows.',
  },
];
