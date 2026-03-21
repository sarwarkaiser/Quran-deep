"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Cpu, RefreshCw, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ProviderResponse = {
  provider: string;
  model: string;
};

type LlmDebugResponse = {
  success: boolean;
  provider?: string;
  model?: string;
  latencyMs?: number;
  cached?: boolean;
  summary?: {
    tokenCards: number;
    paraphrases: number;
    collisions: number;
    promptVersion: string;
    analysisVersion: string;
    wholeAyahPriorityEnforced: boolean;
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
    validation: {
      valid: boolean;
      issues: string[];
    };
    bestMeaning: {
      primary: string;
      secondary: string;
      otherPossible: string[];
      confidence: string;
    };
  };
  error?: string;
  analysis?: unknown;
  rawOutput?: string;
  promptSupplement?: string;
};

const rawApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";
const API_BASE = rawApiBase.endsWith("/v1") ? rawApiBase : `${rawApiBase}/v1`;

export default function DebugPage() {
  const [provider, setProvider] = useState<ProviderResponse | null>(null);
  const [llmResult, setLlmResult] = useState<LlmDebugResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProvider, setIsLoadingProvider] = useState(false);
  const [isRunningLlm, setIsRunningLlm] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [providerOverride, setProviderOverride] = useState("");
  const [modelOverride, setModelOverride] = useState("");
  const [promptSupplement, setPromptSupplement] = useState("");

  const statusTone = useMemo(() => {
    if (error) {
      return "destructive";
    }
    if (llmResult?.success) {
      return "default";
    }
    return "outline";
  }, [error, llmResult]);

  const loadProvider = async () => {
    try {
      setIsLoadingProvider(true);
      setError(null);
      const response = await fetch(`${API_BASE}/debug/provider`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || payload.message || "Provider lookup failed");
      }
      setProvider(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Provider lookup failed");
    } finally {
      setIsLoadingProvider(false);
    }
  };

  const runLlmCheck = async () => {
    try {
      setIsRunningLlm(true);
      setError(null);
      const response = await fetch(`${API_BASE}/debug/llm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: showRaw,
          forceRefresh: false,
          provider: providerOverride || undefined,
          model: modelOverride || undefined,
          promptSupplement: promptSupplement || undefined,
        }),
      });
      const payload = (await response.json()) as LlmDebugResponse;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "LLM debug call failed");
      }
      setLlmResult(payload);
    } catch (runError) {
      setLlmResult(null);
      setError(runError instanceof Error ? runError.message : "LLM debug call failed");
    } finally {
      setIsRunningLlm(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 md:px-6 md:py-10">
      <section className="mb-8 rounded-[28px] border border-border/70 bg-card/85 p-6 shadow-[0_20px_60px_rgba(69,54,27,0.08)]">
        <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
          Provider Debugger
        </p>
        <h1 className="mt-3 font-display text-5xl text-primary">LLM Debug Console</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          Use this page to verify the API server, the active provider, and a real RCQI
          analysis call against the selected model.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge variant={statusTone}>{error ? "Error" : llmResult?.success ? "Healthy" : "Idle"}</Badge>
          <Badge variant="outline">{API_BASE}</Badge>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-[24px] border-border/70 bg-card/85">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-3xl text-primary">
              <Server className="h-5 w-5" />
              Provider
            </CardTitle>
            <CardDescription>
              Reads the currently active provider and model from the running API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={loadProvider} disabled={isLoadingProvider}>
              {isLoadingProvider ? "Loading..." : "Check provider"}
            </Button>

            {provider && (
              <div className="rounded-[20px] border border-border/70 bg-background/70 p-4">
                <p className="text-sm text-muted-foreground">Provider</p>
                <p className="mt-1 font-display text-2xl text-primary">{provider.provider}</p>
                <p className="mt-3 text-sm text-muted-foreground">Model</p>
                <p className="mt-1 text-foreground">{provider.model}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-border/70 bg-card/85">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-3xl text-primary">
              <Cpu className="h-5 w-5" />
              RCQI LLM Call
            </CardTitle>
            <CardDescription>
              Runs a sample RCQI request through `/v1/debug/llm` without needing DB data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  Provider override
                </label>
                <select
                  value={providerOverride}
                  onChange={(event) => setProviderOverride(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Use server default</option>
                  <option value="anthropic">anthropic</option>
                  <option value="openai">openai</option>
                  <option value="openrouter">openrouter</option>
                  <option value="gemini">gemini</option>
                  <option value="ollama">ollama</option>
                  <option value="openai-compatible">openai-compatible</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  Model override
                </label>
                <Input
                  placeholder="Leave blank to use provider default"
                  value={modelOverride}
                  onChange={(event) => setModelOverride(event.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">
                  Custom instruction
                </label>
                <textarea
                  value={promptSupplement}
                  onChange={(event) => setPromptSupplement(event.target.value)}
                  placeholder="Optional extra instruction appended to the RCQI prompt for this run."
                  className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={runLlmCheck} disabled={isRunningLlm}>
                {isRunningLlm ? "Running..." : "Run LLM check"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRaw((current) => !current)}
              >
                {showRaw ? "Hide raw next run" : "Include raw next run"}
              </Button>
            </div>

            {llmResult?.success && llmResult.summary && (
              <div className="rounded-[20px] border border-border/70 bg-background/70 p-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">LLM call succeeded</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Prompt version</p>
                    <p className="text-foreground">{llmResult.summary.promptVersion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Analysis version</p>
                    <p className="text-foreground">{llmResult.summary.analysisVersion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Whole ayah priority</p>
                    <p className="text-foreground">
                      {llmResult.summary.wholeAyahPriorityEnforced ? "enforced" : "not enforced"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Source grounding</p>
                    <p className="text-foreground">
                      {llmResult.summary.sourceGrounding.totalHits} hits across{" "}
                      {llmResult.summary.sourceGrounding.authorsWithHits}/4 authors
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Validation</p>
                    <p className="text-foreground">
                      {llmResult.summary.validation.valid ? "valid" : "issues detected"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Provider</p>
                    <p className="text-foreground">{llmResult.provider}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Model</p>
                    <p className="text-foreground">{llmResult.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prompt override</p>
                    <p className="text-foreground">
                      {llmResult.promptSupplement ? "yes" : "no"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Latency</p>
                    <p className="text-foreground">{llmResult.latencyMs} ms</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cached</p>
                    <p className="text-foreground">{llmResult.cached ? "yes" : "no"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Token cards</p>
                    <p className="text-foreground">{llmResult.summary.tokenCards}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Paraphrases</p>
                    <p className="text-foreground">{llmResult.summary.paraphrases}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-[16px] border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Best meaning
                  </p>
                  <p className="mt-2 text-foreground">
                    {llmResult.summary.bestMeaning.primary}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Confidence: {llmResult.summary.bestMeaning.confidence}
                  </p>
                </div>

                {llmResult.summary.validation.issues.length > 0 && (
                  <div className="mt-4 rounded-[16px] border border-amber-300/40 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-medium">Validation issues</p>
                    <ul className="mt-2 space-y-1">
                      {llmResult.summary.validation.issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {llmResult.summary.sourceGrounding.citations.length > 0 && (
                  <div className="mt-4 rounded-[16px] border border-border/70 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Grounded citations
                    </p>
                    <p className="mt-2 text-sm leading-6 text-foreground">
                      {llmResult.summary.sourceGrounding.citations.join(" | ")}
                    </p>
                  </div>
                )}

                {showRaw && llmResult.rawOutput && (
                  <pre className="mt-4 overflow-x-auto rounded-[16px] border border-border/70 bg-[#111] p-4 text-xs text-white">
                    {llmResult.rawOutput}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mt-4 rounded-[20px] border border-destructive/20 bg-destructive px-4 py-3 text-destructive-foreground">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <Button variant="ghost" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh page state
        </Button>
      </div>
    </main>
  );
}
