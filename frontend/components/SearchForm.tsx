
"use client";

import { Search } from "lucide-react";
import { useState } from "react";

interface SearchFormProps {
  onSearch: (query: string) => void;
  loading?: boolean;
}

export default function SearchForm({
  onSearch,
  loading = false,
}: SearchFormProps) {
  const [owner, setOwner] = useState("facebook");
  const [repo, setRepo] = useState("react");
  const [prNumber, setPrNumber] = useState("37667");
  const [query, setQuery] = useState(
    "Review this pull request"
  );
  const [formError, setFormError] = useState("");

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setFormError("");

    const cleanOwner = owner.trim();
    const cleanRepo = repo.trim();
    const cleanPR = Number(prNumber);

    if (!cleanOwner || !cleanRepo || !prNumber.trim()) {
      setFormError(
        "Please enter the repository owner, repository name, and pull request number."
      );
      return;
    }

    if (
      !Number.isInteger(cleanPR) ||
      cleanPR <= 0
    ) {
      setFormError(
        "Please enter a valid positive pull request number."
      );
      return;
    }

    if (
      !/^[A-Za-z0-9_.-]+$/.test(cleanOwner) ||
      !/^[A-Za-z0-9_.-]+$/.test(cleanRepo)
    ) {
      setFormError(
        "Enter a valid GitHub repository owner and name."
      );
      return;
    }

    const reviewQuery =
      `${query.trim() || "Review this pull request"} ` +
      `PR ${cleanPR} in ${cleanOwner}/${cleanRepo}`;

    onSearch(reviewQuery);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-10 w-full max-w-4xl rounded-xl border border-[#30363d] bg-[#161b22] p-6"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label
            htmlFor="repository-owner"
            className="mb-2 block text-sm text-gray-400"
          >
            Repository Owner
          </label>

          <input
            id="repository-owner"
            type="text"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="facebook"
            required
            disabled={loading}
            className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-4 py-3 text-white placeholder-gray-600 focus:border-green-400 focus:outline-none disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="repository-name"
            className="mb-2 block text-sm text-gray-400"
          >
            Repository Name
          </label>

          <input
            id="repository-name"
            type="text"
            value={repo}
            onChange={(event) => setRepo(event.target.value)}
            placeholder="react"
            required
            disabled={loading}
            className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-4 py-3 text-white placeholder-gray-600 focus:border-green-400 focus:outline-none disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="pull-request-number"
            className="mb-2 block text-sm text-gray-400"
          >
            Pull Request Number
          </label>

          <input
            id="pull-request-number"
            type="number"
            min="1"
            step="1"
            value={prNumber}
            onChange={(event) =>
              setPrNumber(event.target.value)
            }
            placeholder="37667"
            required
            disabled={loading}
            className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-4 py-3 text-white placeholder-gray-600 focus:border-green-400 focus:outline-none disabled:opacity-60"
          />
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="review-query"
          className="mb-2 block text-sm text-gray-400"
        >
          Review Query
        </label>

        <input
          id="review-query"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Review security, bugs, and performance"
          disabled={loading}
          className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-4 py-3 text-white placeholder-gray-600 focus:border-green-400 focus:outline-none disabled:opacity-60"
        />
      </div>

      {formError && (
        <p
          role="alert"
          className="mt-4 text-sm text-red-400"
        >
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-6 py-3 font-semibold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-gray-600 md:w-auto"
      >
        <Search size={18} />

        {loading ? "Analyzing..." : "Review Pull Request"}
      </button>
    </form>
  );
}
