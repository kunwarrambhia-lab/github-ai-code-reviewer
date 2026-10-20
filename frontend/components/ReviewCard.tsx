"use client";

import ReactMarkdown from "react-markdown";
import { FileText } from "lucide-react";

interface ReviewCardProps {
  review: string;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  if (!review) {
    return null;
  }

  return (
    <section className="w-full max-w-5xl mx-auto mt-8">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#30363d]">
          <FileText size={22} className="text-green-400" />

          <h2 className="text-xl font-semibold text-white">
            AI Code Review
          </h2>
        </div>

        <div className="p-6">
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-green-400 mt-6 mb-3">
                    {children}
                  </h2>
                ),

                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold text-white mt-5 mb-2">
                    {children}
                  </h3>
                ),

                p: ({ children }) => (
                  <p className="text-gray-300 leading-7 mb-4">
                    {children}
                  </p>
                ),

                ul: ({ children }) => (
                  <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-4">
                    {children}
                  </ul>
                ),

                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 text-gray-300 space-y-2 mb-4">
                    {children}
                  </ol>
                ),

                li: ({ children }) => (
                  <li className="text-gray-300">
                    {children}
                  </li>
                ),

                strong: ({ children }) => (
                  <strong className="text-white font-semibold">
                    {children}
                  </strong>
                ),

                code: ({ children }) => (
                  <code className="bg-[#0d1117] text-green-300 px-1.5 py-0.5 rounded text-sm">
                    {children}
                  </code>
                ),

                table: ({ children }) => (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-collapse border border-[#30363d]">
                      {children}
                    </table>
                  </div>
                ),

                th: ({ children }) => (
                  <th className="border border-[#30363d] bg-[#0d1117] px-4 py-3 text-left text-white">
                    {children}
                  </th>
                ),

                td: ({ children }) => (
                  <td className="border border-[#30363d] px-4 py-3 text-gray-300">
                    {children}
                  </td>
                ),
              }}
            >
              {review}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </section>
  );
}