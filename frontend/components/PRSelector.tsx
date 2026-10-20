"use client";

import { useState } from "react";
import {
  GitPullRequest,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";

import {
  fetchPullRequests,
  indexPullRequest,
} from "@/lib/api";

interface PullRequest {
  number: number;
  title: string;
  state?: string;
  user?: {
    login?: string;
  };
}

interface PRSelectorProps {
  onSelect: (
    owner: string,
    repo: string,
    prNumber: number
  ) => void;
}

export default function PRSelector({
  onSelect,
}: PRSelectorProps) {
  const [repository, setRepository] =
    useState("facebook/react");

  const [pullRequests, setPullRequests] =
    useState<PullRequest[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [indexing, setIndexing] =
    useState<number | null>(null);

  const [error, setError] = useState("");

  const loadPullRequests = async () => {
    const value = repository.trim();

    if (!value.includes("/")) {
      setError(
        "Enter the repository in owner/repository format."
      );
      return;
    }

    const parts = value.split("/");

    if (parts.length !== 2) {
      setError(
        "Use the format: owner/repository"
      );
      return;
    }

    const owner = parts[0].trim();
    const repo = parts[1].trim();

    if (!owner || !repo) {
      setError(
        "Both owner and repository are required."
      );
      return;
    }

    setLoading(true);
    setError("");
    setPullRequests([]);

    try {
      const data = await fetchPullRequests(
        owner,
        repo
      );

      console.log("Pull requests:", data);

      let prs: PullRequest[] = [];

      if (Array.isArray(data)) {
        prs = data;
      } else if (Array.isArray(data?.items)) {
        prs = data.items;
      } else if (
        Array.isArray(data?.pull_requests)
      ) {
        prs = data.pull_requests;
      } else if (Array.isArray(data?.results)) {
        prs = data.results;
      }

      setPullRequests(prs);

      if (prs.length === 0) {
        setError(
          "No pull requests were found for this repository."
        );
      }
    } catch (err) {
      console.error(
        "Pull request fetch error:",
        err
      );

      setError(
        "Unable to fetch pull requests. Check the repository name and make sure the FastAPI backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectPullRequest = async (
    pr: PullRequest
  ) => {
    const parts = repository
      .trim()
      .split("/");

    if (parts.length !== 2) {
      setError(
        "Invalid repository format."
      );
      return;
    }

    const owner = parts[0].trim();
    const repo = parts[1].trim();

    setIndexing(pr.number);
    setError("");

    try {
      console.log(
        `Indexing ${owner}/${repo} PR #${pr.number}`
      );

      await indexPullRequest(
        owner,
        repo,
        pr.number
      );

      onSelect(
        owner,
        repo,
        pr.number
      );
    } catch (err) {
      console.error(
        "Pull request indexing error:",
        err
      );

      setError(
        `Unable to index pull request #${pr.number}.`
      );
    } finally {
      setIndexing(null);
    }
  };

  return (
    <div className="mx-auto mt-8 max-w-4xl rounded-xl border border-[#30363d] bg-[#161b22] p-5 sm:p-6">

      {/* HEADER */}

      <div className="mb-5 flex items-center gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">

          <GitPullRequest
            size={21}
            className="text-green-400"
          />

        </div>

        <div>

          <h2 className="font-semibold text-white">
            Select Pull Request
          </h2>

          <p className="text-xs text-[#8b949e]">
            Choose a GitHub repository and pull request
            to analyze.
          </p>

        </div>

      </div>

      {/* REPOSITORY INPUT */}

      <div className="flex flex-col gap-3 sm:flex-row">

        <input
          type="text"
          value={repository}
          onChange={(event) =>
            setRepository(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              loadPullRequests();
            }
          }}
          placeholder="owner/repository"
          className="flex-1 rounded-lg border border-[#30363d] bg-[#0d1117] px-4 py-3 text-sm text-white outline-none placeholder:text-[#6e7681] focus:border-green-500"
        />

        <button
          onClick={loadPullRequests}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
        >

          {loading ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <Search size={18} />
          )}

          {loading
            ? "Loading..."
            : "Fetch PRs"}

        </button>

      </div>

      {/* ERROR */}

      {error && (

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">

          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>

        </div>

      )}

      {/* PR LIST */}

      {pullRequests.length > 0 && (

        <div className="mt-5">

          <div className="mb-3 flex items-center justify-between">

            <p className="text-sm font-medium text-[#f0f6fc]">
              Available Pull Requests
            </p>

            <p className="text-xs text-[#8b949e]">
              {pullRequests.length} found
            </p>

          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">

            {pullRequests.map((pr) => (

              <button
                key={pr.number}
                onClick={() =>
                  selectPullRequest(pr)
                }
                disabled={indexing !== null}
                className="flex w-full items-center gap-3 rounded-lg border border-[#30363d] bg-[#0d1117] p-4 text-left transition hover:border-green-500/50 hover:bg-[#161b22] disabled:cursor-not-allowed disabled:opacity-50"
              >

                <GitPullRequest
                  size={18}
                  className="shrink-0 text-green-400"
                />

                <div className="min-w-0 flex-1">

                  <p className="break-words text-sm font-medium text-white">

                    #{pr.number}{" "}

                    {pr.title ||
                      "Untitled pull request"}

                  </p>

                  <div className="mt-1 flex flex-wrap gap-3">

                    {pr.user?.login && (
                      <span className="text-xs text-[#8b949e]">
                        by {pr.user.login}
                      </span>
                    )}

                    {pr.state && (
                      <span className="text-xs text-[#8b949e]">
                        {pr.state}
                      </span>
                    )}

                  </div>

                </div>

                {indexing === pr.number && (

                  <div className="flex shrink-0 items-center gap-2">

                    <Loader2
                      size={18}
                      className="animate-spin text-green-400"
                    />

                    <span className="hidden text-xs text-[#8b949e] sm:block">
                      Indexing...
                    </span>

                  </div>

                )}

              </button>

            ))}

          </div>

        </div>

      )}

    </div>
  );
}