"use client";

import { LoaderCircle } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="w-full max-w-5xl mx-auto mt-8">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 flex flex-col items-center justify-center">
        <LoaderCircle
          size={40}
          className="text-green-400 animate-spin"
        />

        <p className="text-gray-300 mt-4 text-lg">
          Analyzing Pull Request...
        </p>

        <p className="text-gray-500 mt-2 text-sm">
          FastAPI and Groq AI are generating your code review.
        </p>
      </div>
    </div>
  );
}