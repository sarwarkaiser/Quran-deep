# TASKS

Single source of truth for current status, next work, and anti-duplication rules.

Last updated: 2026-03-13

## How To Use

- Before starting work, read this file first.
- Do not reopen finished items unless there is a regression, a new requirement, or a failed verification.
- When starting an item, move it to `In Progress`.
- When finishing an item, move it to `Done`, add the date, and note the verification command or endpoint.
- If new work appears during implementation, add it under `Backlog`, not as a hidden side quest.

## Done

- 2026-03-13: Fixed API and database schema mismatches so the backend builds again.
  Verification: `pnpm --filter api build`
- 2026-03-13: Fixed web/API port alignment and local runtime defaults.
  Current defaults: web `3010`, API `3011`
- 2026-03-13: Reworked the web reader UI and made all words clickable.
  Verification: `pnpm --filter @rcqi/web build`
- 2026-03-13: Added per-ayah analysis flow instead of implicit auto-generation on load.
- 2026-03-13: Added multi-provider LLM support.
  Supported: `anthropic`, `openai`, `openrouter`, `gemini`, `ollama`, `openai-compatible`
- 2026-03-13: Added engine smoke test and API smoke test.
  Commands: `pnpm --filter @rcqi/engine smoke`, `pnpm --filter api smoke`
- 2026-03-13: Added `/v1/debug/provider`, `/v1/debug/llm`, and browser debug page at `/debug`.
- 2026-03-13: Fixed the web loading loop and font/network build issues.
- 2026-03-13: Repaired morphology ETL and aligned it with Supabase-backed runtime queries.
- 2026-03-13: Added fallback ayah word rendering when morphology rows are missing.
- 2026-03-13: Integrated RCQI whole-ayah enforcement and versioned it as prompt/analysis `2.1.0`.
- 2026-03-13: Added retrieval-backed `Original Source Interpretations` starter layer for Farahi, Raghib, Izutsu, and Asad.
  Verification: sample grounding returns hits across all four authors for `1:2`

## In Progress

- Full morphology import completion check.
  Status: import path is repaired and early/later spot checks have succeeded, but full-corpus completion should still be verified end-to-end.
  Definition of done: representative late surahs such as `36:1` and `114:1` return populated `/v1/ayahs/:surah/:ayah/words`.

## Next

### 1. Expand the source corpus

- Add more grounded packets for Farahi.
- Add real root-entry packets for Raghib across the most frequent Qur'anic roots.
- Add concept packets for Izutsu mapped to recurring semantic fields.
- Add ayah translation/note packets for Asad beyond the starter sample.
- Keep citations concise and source-backed.

Definition of done:
- The debug page shows grounded hits for a broad set of test ayahs, not just `1:2`.
- The `originalSources` section is mostly corpus-backed for common ayahs.

### 2. Add parser and source-grounding tests

- Unit test JSON extraction fallbacks in the engine.
- Unit test `buildOriginalSourceContext()` scoring and author coverage.
- Add fixture-based tests for weak provider output and grounded-source merge behavior.

Definition of done:
- `pnpm --filter @rcqi/engine test` or equivalent passes locally.

### 3. Validate real provider runs end-to-end

- Test at least one live run per intended provider.
- Record known-good env examples and preferred models.
- Capture provider-specific JSON issues and tune prompts/settings where needed.

Definition of done:
- `/debug` succeeds with at least two real providers.

### 4. Make RCQI status clearer in the reader

- Show per-ayah analysis state: cached, generating, failed, grounded-source coverage.
- Add a retry action on failed analysis.
- Surface prompt/analysis version and maybe source-hit count in the UI panel.

Definition of done:
- A user can tell whether an ayah analysis is cached, fresh, failed, or weakly grounded.

### 5. Finish morphology/data verification

- Verify full word coverage after import.
- Identify any systematic empty ayahs.
- Add a repeatable verification script for coverage by surah and ayah count.

Definition of done:
- Coverage report exists and known gaps are documented.

## Backlog

- Build a proper searchable local corpus/index for the four source authors instead of a starter packet file.
- Add semantic search once embeddings are real rather than placeholder.
- Add API route tests for Quran and RCQI endpoints.
- Add one browser interaction test for clicking a word and opening the analysis panel.
- Add batch analysis queueing instead of placeholder queued responses.
- Add richer token-level RCQI cards when provider output is partial.
- Reconcile README/package docs with the exact current runtime and supported features.

## Do Not Repeat

- Do not reintroduce auto-analysis on surah load.
- Do not treat old RCQI cache entries as valid if prompt/analysis version mismatches.
- Do not add features before checking current build status:
  - `pnpm --filter api build`
  - `pnpm --filter @rcqi/engine type-check`
  - `pnpm --filter @rcqi/web build`
- Do not assume morphology is missing because Supabase is disconnected; verify the words endpoint first.
- Do not expand the `Original Source Interpretations` layer with unsourced prose. Add packets to the source corpus instead.

## Useful Commands

```bash
pnpm --filter api build
pnpm --filter @rcqi/engine type-check
pnpm --filter @rcqi/web build
pnpm --filter @rcqi/engine smoke
pnpm --filter api smoke
curl -sS http://localhost:3011/v1/debug/provider
```
