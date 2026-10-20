
"use client";

import { useState } from "react";
import {
  FolderGit2,
  FileCode2,
  AlertCircle,
  Download,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import SearchForm from "@/components/SearchForm";
import ReviewCard from "@/components/ReviewCard";
import AnalysisCard from "@/components/AnalysisCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import ChatPanel from "@/components/ChatPanel";
import StatCard from "@/components/StatCard";
import PRSelector from "@/components/PRSelector";
import FindingCard, {
  type Finding,
} from "@/components/FindingCard";

import {
  fetchReview,
  fetchSearch,
  fetchAnalysis,
  downloadReviewReport,
} from "@/lib/api";

interface AnalysisData {
  security: string;
  performance: string;
  bugs: string;
  bestPractices: string;
}

interface AnalysisFinding extends Finding {
  title: string;
  category: string;
  severity: string;
  file: string;
  evidence: string;
  impact: string;
  recommendation: string;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value);

const getString = (
  value: unknown,
  fallback = ""
): string => {
  return typeof value === "string"
    ? value.trim() || fallback
    : fallback;
};

const normalizeCategory = (category: string): string => {
  const value = category.toLowerCase().trim();

  if (
    value.includes("security") ||
    value.includes("vulnerability")
  ) {
    return "Security";
  }

  if (
    value.includes("bug") ||
    value.includes("correctness") ||
    value.includes("error") ||
    value.includes("logic")
  ) {
    return "Bug";
  }

  if (
    value.includes("performance") ||
    value.includes("efficiency")
  ) {
    return "Performance";
  }

  if (
    value.includes("best practice") ||
    value.includes("best-practice") ||
    value.includes("style") ||
    value.includes("maintainability") ||
    value.includes("code quality") ||
    value.includes("readability")
  ) {
    return "Best Practice";
  }

  return "Other";
};

const normalizeSeverity = (severity: string): string => {
  const value = severity.toLowerCase().trim();

  if (value === "critical" || value === "blocker") {
    return "Critical";
  }

  if (value === "high" || value === "major") {
    return "High";
  }

  if (
    value === "medium" ||
    value === "moderate" ||
    value === "medium severity"
  ) {
    return "Medium";
  }

  if (
    value === "low" ||
    value === "info" ||
    value === "informational" ||
    value === "minor"
  ) {
    return "Low";
  }

  return "Unknown";
};

const normalizeRecommendation = (value: unknown): string => {
  if (typeof value !== "string") return "";

  const normalized = value.trim().toLowerCase();

  if (
    normalized === "approve" ||
    normalized === "approved"
  ) {
    return "Approve";
  }

  if (
    normalized === "request changes" ||
    normalized === "request_changes" ||
    normalized === "request-changes" ||
    normalized === "changes requested"
  ) {
    return "Request changes";
  }

  if (
    normalized === "needs manual review" ||
    normalized === "review required" ||
    normalized === "manual review" ||
    normalized === "manual review required"
  ) {
    return "Needs manual review";
  }

  return value.trim();
};

const getCategoryReport = (
  findings: AnalysisFinding[],
  category: string
): string => {
  const matching = findings.filter(
    (finding) =>
      normalizeCategory(finding.category) === category
  );

  if (matching.length === 0) {
    return `No structured ${category.toLowerCase()} findings were returned.`;
  }

  return matching
    .map((finding) =>
      [
        finding.title,
        `Severity: ${finding.severity}`,
        `File: ${finding.file}`,
        `Description: ${finding.description || "Not provided"}`,
        `Evidence: ${finding.evidence || "Not provided"}`,
        `Impact: ${finding.impact || "Not provided"}`,
        `Suggested fix: ${finding.recommendation || "Not provided"}`,
      ].join("\n")
    )
    .join("\n\n");
};

const extractSearchItems = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return [];
  }

  if (Array.isArray(value.results)) {
    return value.results;
  }

  if (isRecord(value.results)) {
    const nested = value.results;

    if (Array.isArray(nested.results)) {
      return nested.results;
    }
  }

  return [];
};

/**
 * Extract text from common AI review response formats.
 * Supports a direct string, a FastAPI { review: "..." } object,
 * and common nested response wrappers.
 */
const extractReviewText = (
  value: unknown,
  depth = 0
): string => {
  if (depth > 5) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (!isRecord(value)) {
    return "";
  }

  // Standard backend response:
  // { success: true, review: "## 1. Summary..." }
  if (
    typeof value.review === "string" &&
    value.review.trim()
  ) {
    return value.review.trim();
  }

  // Check nested response wrappers.
  for (const field of [
    "data",
    "result",
    "response",
    "output",
  ]) {
    const nested = value[field];

    if (typeof nested === "string" && nested.trim()) {
      return nested.trim();
    }

    if (isRecord(nested) || Array.isArray(nested)) {
      const extracted = extractReviewText(
        nested,
        depth + 1
      );

      if (extracted) {
        return extracted;
      }
    }
  }

  // Alternate Markdown/content field names.
  for (const field of [
    "markdown",
    "content",
    "text",
  ]) {
    const candidate = value[field];

    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "";
};

const normalizeFinding = (
  item: UnknownRecord
): AnalysisFinding | null => {
  const title = getString(
    item.title,
    getString(item.name)
  );

  const file = getString(
    item.file,
    getString(item.filename, getString(item.path))
  );

  const description = getString(
    item.description,
    getString(item.details, getString(item.message))
  );

  const evidence = getString(
    item.evidence,
    getString(item.code, getString(item.snippet))
  );

  if (!title || !file || (!description && !evidence)) {
    return null;
  }

  const rawSeverity = getString(
    item.severity,
    "Unknown"
  );

  const rawCategory = getString(
    item.category,
    getString(item.type, "Other")
  );

  const suggestion = getString(
    item.suggestion,
    getString(
      item.recommendation,
      getString(item.fix, getString(item.remediation))
    )
  );

  const impact = getString(
    item.impact,
    getString(item.risk)
  );

  return {
    ...(item as unknown as Finding),
    title,
    file,
    severity: normalizeSeverity(rawSeverity),
    category: rawCategory,
    description,
    evidence,
    impact,
    recommendation: suggestion,
  } as AnalysisFinding;
};

export default function Home() {
  const [review, setReview] = useState("");
  const [analysis, setAnalysis] =
    useState<AnalysisData | null>(null);
  const [findings, setFindings] =
    useState<AnalysisFinding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [repository, setRepository] =
    useState("facebook/react");
  const [files, setFiles] = useState<string[]>([]);
  const [selectedPR, setSelectedPR] =
    useState<number | null>(null);
  const [recommendation, setRecommendation] =
    useState("");
  const [analysisSummary, setAnalysisSummary] =
    useState("");
  const [severityFilter, setSeverityFilter] =
    useState("All");
  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const handleSearch = async (query: string) => {
    const prMatch = query.match(
      /(?:pull request|PR)\s*#?\s*(\d+)/i
    );

    const repoMatch = query.match(
      /\bin\s+([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/i
    );

    const prNumber = prMatch
      ? Number(prMatch[1])
      : selectedPR;

    const [currentOwner, currentRepo] = repoMatch
      ? [repoMatch[1], repoMatch[2]]
      : repository.split("/");

    if (
      !currentOwner ||
      !currentRepo ||
      !prNumber ||
      !Number.isInteger(prNumber) ||
      prNumber <= 0
    ) {
      setError(
        "Enter a repository and valid pull request number before starting the review."
      );
      return;
    }

    const context = {
      owner: currentOwner,
      repo: currentRepo,
      prNumber,
    };

    setRepository(`${currentOwner}/${currentRepo}`);
    setSelectedPR(prNumber);
    setLoading(true);
    setError("");
    setReview("");
    setAnalysis(null);
    setFindings([]);
    setFiles([]);
    setRecommendation("");
    setAnalysisSummary("");
    setSeverityFilter("All");
    setCategoryFilter("All");

    try {
      const [
        searchOutcome,
        reviewOutcome,
        analysisOutcome,
      ] = await Promise.allSettled([
        fetchSearch(query, context),
        fetchReview(query, context),
        fetchAnalysis(query, context),
      ]);

      // 1. Extract changed files.
      if (searchOutcome.status === "fulfilled") {
        const items = extractSearchItems(
          searchOutcome.value
        );

        const names = items
          .filter(isRecord)
          .map((item) => {
            const metadata = isRecord(item.metadata)
              ? item.metadata
              : {};

            return getString(
              item.filename,
              getString(
                item.file,
                getString(
                  item.path,
                  getString(
                    metadata.filename,
                    getString(metadata.file)
                  )
                )
              )
            );
          })
          .filter((name) => name.length > 0);

        setFiles([...new Set(names)]);
      } else {
        console.error(
          "Search endpoint failed:",
          searchOutcome.reason
        );
      }

      // 2. Extract the complete detailed review.
      let reviewText = "";

      if (reviewOutcome.status === "fulfilled") {
        console.log(
          "Review API response:",
          reviewOutcome.value
        );

        reviewText = extractReviewText(
          reviewOutcome.value
        );

        console.log(
          "Extracted review length:",
          reviewText.length
        );

        if (reviewText) {
          setReview(reviewText);
        } else {
          console.error(
            "Could not extract review text. Full response:",
            reviewOutcome.value
          );
        }
      } else {
        console.error(
          "Review endpoint failed:",
          reviewOutcome.reason
        );
      }

      // 3. Process structured analysis independently.
      if (analysisOutcome.status === "rejected") {
        console.error(
          "Analysis endpoint failed:",
          analysisOutcome.reason
        );

        setError(
          reviewText
            ? "The detailed review loaded, but structured analysis failed."
            : "The review or structured analysis failed. Check the browser console and FastAPI terminal."
        );

        return;
      }

      const response: unknown = analysisOutcome.value;

      if (!isRecord(response)) {
        throw new Error(
          "The analysis endpoint returned an invalid response."
        );
      }

      // FastAPI wraps structured results in response.analysis.
      const payload = isRecord(response.analysis)
        ? response.analysis
        : response;

      if (payload.success === false) {
        setError(
          getString(
            payload.message,
            "The structured analysis could not be completed."
          )
        );
        return;
      }

      let parsedReport: UnknownRecord = {};

      if (typeof payload.analysis === "string") {
        try {
          const parsed: unknown = JSON.parse(
            payload.analysis
          );

          if (isRecord(parsed)) {
            parsedReport = parsed;
          }
        } catch {
          console.warn(
            "The nested analysis string was not valid JSON."
          );
        }
      } else if (isRecord(payload.analysis)) {
        parsedReport = payload.analysis;
      }

      const summary =
        getString(payload.summary) ||
        getString(parsedReport.summary);

      const topLevelFindings = Array.isArray(
        payload.findings
      )
        ? payload.findings
        : [];

      const nestedFindings = Array.isArray(
        parsedReport.findings
      )
        ? parsedReport.findings
        : [];

      const rawFindings =
        topLevelFindings.length > 0 ||
        nestedFindings.length === 0
          ? topLevelFindings
          : nestedFindings;

      const validFindings: AnalysisFinding[] =
        rawFindings
          .filter(isRecord)
          .map(normalizeFinding)
          .filter(
            (
              finding
            ): finding is AnalysisFinding =>
              finding !== null
          );

      const rawRecommendation =
        payload.recommendation ??
        parsedReport.recommendation;

      const structuredRecommendation =
        normalizeRecommendation(rawRecommendation);

      setAnalysisSummary(summary);
      setFindings(validFindings);
      setRecommendation(structuredRecommendation);

      setAnalysis({
        security: getCategoryReport(
          validFindings,
          "Security"
        ),
        performance: getCategoryReport(
          validFindings,
          "Performance"
        ),
        bugs: getCategoryReport(
          validFindings,
          "Bug"
        ),
        bestPractices: getCategoryReport(
          validFindings,
          "Best Practice"
        ),
      });

      if (
        !summary &&
        !reviewText &&
        validFindings.length === 0
      ) {
        setError(
          "The backend returned no summary, detailed review, or structured findings."
        );
      } else if (!reviewText) {
        setError(
          "Structured analysis completed, but the detailed review was empty. Check the browser console for the review response."
        );
      }
    } catch (err) {
      console.error("Frontend API error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete the review. Check that FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // Pull request selection.
  const handlePRSelect = (
    owner: string,
    repo: string,
    prNumber: number
  ) => {
    setRepository(`${owner}/${repo}`);
    setSelectedPR(prNumber);

    void handleSearch(
      `Review pull request ${prNumber} in ${owner}/${repo}`
    );
  };

  // Finding filters.
  const filteredFindings = findings.filter(
    (finding) => {
      const matchesSeverity =
        severityFilter === "All" ||
        finding.severity === severityFilter;

      const matchesCategory =
        categoryFilter === "All" ||
        normalizeCategory(finding.category) ===
          categoryFilter;

      return matchesSeverity && matchesCategory;
    }
  );

  // Dashboard statistics.
  const securityCount = findings.filter(
    (finding) =>
      normalizeCategory(finding.category) ===
      "Security"
  ).length;

  const bugCount = findings.filter(
    (finding) =>
      normalizeCategory(finding.category) === "Bug"
  ).length;

  const performanceCount = findings.filter(
    (finding) =>
      normalizeCategory(finding.category) ===
      "Performance"
  ).length;

  const highSeverityCount = findings.filter(
    (finding) =>
      finding.severity === "Critical" ||
      finding.severity === "High"
  ).length;

  // Export the detailed review.
  const handleDownloadReport = () => {
    if (!review.trim()) {
      setError(
        "Generate a review before exporting the report."
      );
      return;
    }

    const [owner, repo] = repository.split("/");

    downloadReviewReport(review, {
      owner,
      repo,
      prNumber: selectedPR ?? undefined,
    });

    setError("");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0d1117] text-white">
      <Navbar />

      {/* Hero and search */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            AI Powered
            <span className="text-green-400">
              {" "}GitHub Pull Request Reviewer
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-gray-400 sm:text-lg">
            Analyze GitHub Pull Requests using Semantic Search,
            ChromaDB, FastAPI and Groq AI.
          </p>
        </div>

        <SearchForm
          onSearch={(query) => {
            const match = query.match(
              /PR\s*#?\s*(\d+)\s+in\s+([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/i
            );

            if (match) {
              setSelectedPR(Number(match[1]));
              setRepository(match[2]);
            }

            void handleSearch(query);
          }}
          loading={loading}
        />

        <PRSelector onSelect={handlePRSelect} />
      </section>

      {/* Error feedback */}
      {error && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 sm:text-base"
          >
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />
            <p>{error}</p>
          </div>
        </div>
      )}

      {loading && <LoadingSpinner />}

      {/* Main dashboard */}
      {!loading && (review || analysis) && (
        <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Repository heading and report export */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#8b949e]">
                Pull Request Analysis
              </p>

              <h2 className="mt-1 break-all text-xl font-bold text-[#f0f6fc] sm:text-2xl">
                {repository}
              </h2>

              <div className="mt-1 text-sm text-[#8b949e]">
                {selectedPR !== null
                  ? `Pull Request #${selectedPR}`
                  : "AI-powered code review"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadReport}
              disabled={!review.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-400 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={18} />
              Download Report
            </button>
          </div>

          {/* AI summary */}
          {analysisSummary && (
            <div className="mb-6 rounded-xl border border-[#30363d] bg-[#161b22] p-4 sm:p-5">
              <h2 className="font-semibold text-[#f0f6fc]">
                AI Summary
              </h2>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#c9d1d9]">
                {analysisSummary}
              </p>
            </div>
          )}

          {/* Statistics */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Files Changed"
              value={files.length}
              type="files"
            />

            <StatCard
              title="Security Findings"
              value={securityCount}
              type="security"
            />

            <StatCard
              title="Potential Bugs"
              value={bugCount}
              type="bugs"
            />

            <StatCard
              title="Performance Findings"
              value={performanceCount}
              type="performance"
            />
          </div>

          {/* Structured findings */}
          <section className="mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-[#f0f6fc] sm:text-2xl">
                Detected Findings
              </h2>

              <p className="mt-1 text-sm text-[#8b949e]">
                Showing {filteredFindings.length} of{" "}
                {findings.length} findings.
              </p>

              {highSeverityCount > 0 && (
                <p className="mt-2 text-sm text-orange-300">
                  {highSeverityCount} Critical/High severity
                  finding(s) need closer review.
                </p>
              )}
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="severity-filter"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Filter by severity
                </label>

                <select
                  id="severity-filter"
                  value={severityFilter}
                  onChange={(event) =>
                    setSeverityFilter(event.target.value)
                  }
                  className="w-full rounded-lg border border-[#30363d] bg-[#161b22] p-3 text-sm text-white outline-none focus:border-green-400"
                >
                  <option value="All">All severities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="category-filter"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Filter by category
                </label>

                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(event.target.value)
                  }
                  className="w-full rounded-lg border border-[#30363d] bg-[#161b22] p-3 text-sm text-white outline-none focus:border-green-400"
                >
                  <option value="All">All categories</option>
                  <option value="Security">Security</option>
                  <option value="Bug">Bug</option>
                  <option value="Performance">Performance</option>
                  <option value="Best Practice">Best Practice</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {filteredFindings.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {filteredFindings.map((finding, index) => (
                  <FindingCard
                    key={`${finding.file}-${finding.title}-${index}`}
                    finding={finding}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-6 text-center">
                <p className="text-sm text-gray-400">
                  {findings.length === 0
                    ? "No structured findings were returned by the AI. This does not guarantee the code is free of issues. Review the full report."
                    : "No findings match these filters."}
                </p>

                {findings.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSeverityFilter("All");
                      setCategoryFilter("All");
                    }}
                    className="mt-3 rounded-lg border border-[#30363d] px-4 py-2 text-sm text-green-400 transition hover:bg-[#21262d]"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSeverityFilter("All");
                setCategoryFilter("All");
              }}
              className="mt-4 rounded-lg border border-[#30363d] px-4 py-2 text-sm text-gray-300 transition hover:bg-[#21262d]"
            >
              Reset all filters
            </button>
          </section>

          {/* Repository and changed files */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
            <aside className="lg:col-span-3">
              <div className="overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22]">
                <div className="border-b border-[#30363d] p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <FolderGit2
                      size={22}
                      className="shrink-0 text-green-400"
                    />

                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">
                        Repository
                      </p>

                      <p className="break-all font-semibold text-white">
                        {repository}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <FileCode2
                      size={19}
                      className="shrink-0 text-gray-400"
                    />

                    <h2 className="font-semibold text-white">
                      Changed Files
                    </h2>
                  </div>

                  {files.length > 0 ? (
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={`${file}-${index}`}
                          className="flex items-start gap-2 rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 transition hover:border-green-400"
                        >
                          <FileCode2
                            size={15}
                            className="mt-0.5 shrink-0 text-green-400"
                          />

                          <span className="break-all text-sm text-gray-300">
                            {file}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No files were returned by semantic search.
                    </p>
                  )}
                </div>
              </div>
            </aside>

            {/* Detailed Markdown review */}
            <section className="min-w-0 lg:col-span-6">
              {review ? (
                <ReviewCard review={review} />
              ) : (
                <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
                  <h2 className="font-semibold text-white">
                    AI Code Review
                  </h2>

                  <p className="mt-2 text-sm text-amber-300">
                    The detailed review was not returned. The
                    structured analysis is shown separately.
                  </p>
                </div>
              )}
            </section>

            {/* Category reports */}
            <aside className="lg:col-span-3">
              {analysis && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1">
                  <AnalysisCard
                    title="Security"
                    type="security"
                    content={analysis.security}
                  />

                  <AnalysisCard
                    title="Performance"
                    type="performance"
                    content={analysis.performance}
                  />

                  <AnalysisCard
                    title="Potential Bugs"
                    type="bugs"
                    content={analysis.bugs}
                  />

                  <AnalysisCard
                    title="Best Practices"
                    type="best-practices"
                    content={analysis.bestPractices}
                  />
                </div>
              )}
            </aside>
          </div>

          {/* Overall recommendation */}
          {recommendation && (
            <section className="mt-6 rounded-xl border border-green-500/20 bg-[#161b22] p-4 sm:p-5">
              <h2 className="font-semibold text-green-400">
                Overall Recommendation
              </h2>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#c9d1d9]">
                {recommendation}
              </p>
            </section>
          )}

          {/* AI Pull Request Assistant */}
          <div className="mt-6">
          <ChatPanel
            owner={repository.split("/")[0] ?? ""}
            repo={repository.split("/")[1] ?? ""}
            prNumber={selectedPR}
/>
          </div>
        </section>
      )}

      {/* Initial dashboard state */}
      {!loading && !review && !analysis && !error && (
        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
          <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-6 text-center sm:p-10">
            <FolderGit2
              size={42}
              className="mx-auto text-green-400"
            />

            <h2 className="mt-5 text-xl font-bold sm:text-2xl">
              Ready to Review Your Pull Request
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
              Enter a GitHub repository and pull request above.
              The AI reviewer will analyze the code and provide a
              detailed review, structured findings, security and
              performance insights, and best-practice recommendations.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
