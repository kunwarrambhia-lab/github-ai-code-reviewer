
"use client";

import { useState } from "react";
import type { KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import {
  Send,
  Bot,
  User,
  Loader2,
  Trash2,
} from "lucide-react";

import { fetchChat } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  time: string;
}

interface ChatPanelProps {
  owner: string;
  repo: string;
  prNumber: number | null;
}

const createInitialMessage = (): Message => ({
  role: "assistant",
  content:
    "Hi! I’m your AI Pull Request Assistant. Ask me anything about the indexed pull request.",
  time: new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
});

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data: unknown = error.response?.data;

    if (data && typeof data === "object") {
      const body = data as Record<string, unknown>;

      if (typeof body.detail === "string") {
        return `API error${status ? ` (${status})` : ""}: ${body.detail}`;
      }

      if (typeof body.message === "string") {
        return `API error${status ? ` (${status})` : ""}: ${body.message}`;
      }
    }

    if (status === 404) {
      return "The chat endpoint was not found. Check that your FastAPI application defines GET /chat.";
    }

    if (status === 422) {
      return "The chat request is missing required parameters. Check the query, owner, repo, and pr_number fields.";
    }

    if (status === 401 || status === 403) {
      return "The chat request was rejected. Check the backend authentication and API configuration.";
    }

    if (status && status >= 500) {
      return `The backend returned error ${status}. Check the FastAPI terminal for details.`;
    }

    if (error.code === "ECONNABORTED") {
      return "The AI chat request timed out. Please try again.";
    }

    if (!error.response) {
      return "Cannot reach FastAPI at http://127.0.0.1:8000. Check that the backend is running.";
    }

    return error.message || "The chat request failed.";
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred while chatting with the AI.";
};

const extractAnswer = (
  data: unknown,
  depth = 0
): string => {
  if (depth > 4 || data == null) {
    return "";
  }

  if (typeof data === "string") {
    const value = data.trim();

    if (!value) {
      return "";
    }

    // Handle JSON serialized as a string.
    if (
      (value.startsWith("{") && value.endsWith("}")) ||
      (value.startsWith("[") && value.endsWith("]"))
    ) {
      try {
        return extractAnswer(
          JSON.parse(value),
          depth + 1
        );
      } catch {
        return value;
      }
    }

    return value;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const answer = extractAnswer(item, depth + 1);

      if (answer) {
        return answer;
      }
    }

    return "";
  }

  if (typeof data !== "object") {
    return "";
  }

  const result = data as Record<string, unknown>;

  // Common API response fields.
  for (const key of [
    "answer",
    "response",
    "message",
    "content",
    "text",
    "output",
    "review",
  ]) {
    const value = result[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  // Handle nested response structures.
  for (const key of [
    "data",
    "result",
    "choices",
  ]) {
    if (result[key] !== undefined) {
      const answer = extractAnswer(
        result[key],
        depth + 1
      );

      if (answer) {
        return answer;
      }
    }
  }

  return "";
};

export default function ChatPanel({
  owner,
  repo,
  prNumber,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    createInitialMessage(),
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const getCurrentTime = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const sendMessage = async (question?: string) => {
    const query = (question ?? input).trim();

    if (!query || loading) {
      return;
    }

    // Ensure a pull request has been selected.
    if (!owner.trim() || !repo.trim() || !prNumber) {
      setMessages((previous) => [
        ...previous,
        {
          role: "user",
          content: query,
          time: getCurrentTime(),
        },
        {
          role: "assistant",
          content:
            "Please select a repository and pull request, then run a review before asking questions.",
          time: getCurrentTime(),
        },
      ]);

      setInput("");
      return;
    }

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: query,
        time: getCurrentTime(),
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      console.log("Sending chat request:", {
        query,
        owner,
        repo,
        pr_number: prNumber,
      });

      const data = await fetchChat(query, {
        owner,
        repo,
        prNumber,
      });

      console.log("Chat API response:", data);

      const answer = extractAnswer(data);

      if (!answer) {
        console.error(
          "Unrecognized chat response structure:",
          JSON.stringify(data, null, 2)
        );

        throw new Error(
          "The chat API responded, but no answer text was found. Open the browser console and inspect 'Chat API response'."
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: answer,
          time: getCurrentTime(),
        },
      ]);
    } catch (error) {
      console.error("Chat API error:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: `⚠️ ${getErrorMessage(error)}`,
          time: getCurrentTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([createInitialMessage()]);
    setInput("");
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const suggestedQuestions = [
    "Summarize the main changes",
    "Which files were modified?",
    "Explain the main change",
    "What potential bugs exist?",
    "What are the performance impacts?",
    "Are there any security issues?",
  ];

  return (
    <div className="flex h-full min-h-[600px] flex-col overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363d] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
            <Bot
              size={21}
              className="text-green-400"
            />
          </div>

          <div>
            <h2 className="font-semibold text-[#f0f6fc]">
              AI Pull Request Assistant
            </h2>

            <p className="text-xs text-[#8b949e]">
              {owner && repo && prNumber
                ? `${owner}/${repo} · PR #${prNumber}`
                : "Select a pull request to start chatting"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={clearChat}
          disabled={loading}
          title="Clear chat"
          className="flex items-center gap-2 rounded-lg border border-[#30363d] px-3 py-2 text-xs text-[#8b949e] transition hover:border-red-500 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={15} />

          <span className="hidden sm:inline">
            Clear Chat
          </span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.map((message, index) => (
          <div
            key={`${message.time}-${index}`}
            className={`flex gap-3 ${
              message.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                <Bot
                  size={17}
                  className="text-green-400"
                />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "bg-green-600 text-white"
                  : "border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
              }`}
            >
              {message.role === "assistant" ? (
                <div className="max-w-none break-words">
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}

              <div
                className={`mt-2 text-[10px] ${
                  message.role === "user"
                    ? "text-green-100"
                    : "text-[#6e7681]"
                }`}
              >
                {message.time}
              </div>
            </div>

            {message.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                <User
                  size={17}
                  className="text-blue-400"
                />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
              <Bot
                size={17}
                className="text-green-400"
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#30363d] bg-[#0d1117] px-4 py-3">
              <Loader2
                size={16}
                className="animate-spin text-green-400"
              />

              <span className="text-sm text-[#8b949e]">
                AI is analyzing the pull request...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      <div className="border-t border-[#30363d] px-4 pt-3">
        <p className="mb-2 text-xs text-[#8b949e]">
          Suggested questions
        </p>

        <div className="flex gap-2 overflow-x-auto pb-3">
          {suggestedQuestions.map((question) => (
            <button
              type="button"
              key={question}
              onClick={() => {
                void sendMessage(question);
              }}
              disabled={loading}
              className="whitespace-nowrap rounded-lg border border-[#30363d] px-3 py-2 text-xs text-[#8b949e] transition hover:border-green-500 hover:text-green-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-[#30363d] p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Ask something about this pull request..."
            disabled={loading}
            className="flex-1 rounded-lg border border-[#30363d] bg-[#0d1117] px-4 py-3 text-sm text-[#f0f6fc] outline-none placeholder:text-[#6e7681] focus:border-green-500"
          />

          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <Loader2
                size={19}
                className="animate-spin"
              />
            ) : (
              <Send size={19} />
            )}
          </button>
        </div>

        <p className="mt-2 text-center text-xs text-[#6e7681]">
          AI responses are based on the selected pull request.
        </p>
      </div>
    </div>
  );
}
