"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { checkHealth } from "@/lib/api";

export default function Navbar() {
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    const checkAPI = async () => {
      try {
        const data = await checkHealth();

        setApiOnline(data?.status === "healthy");
      } catch {
        setApiOnline(false);
      }
    };

    checkAPI();

    const interval = setInterval(checkAPI, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="w-full border-b border-[#30363d] bg-[#161b22] text-white">

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="flex h-16 items-center justify-between">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-green-500/20 bg-green-500/10">

              <ShieldCheck
                size={23}
                className="text-green-400"
              />

            </div>

            <div className="min-w-0">

              <h1 className="truncate text-sm font-bold text-[#f0f6fc] sm:text-base">
                GitHub AI Code Reviewer
              </h1>

              <p className="hidden text-xs text-[#8b949e] sm:block">
                Intelligent Pull Request Analysis
              </p>

            </div>

          </div>

          <div
            className={`hidden items-center gap-2 text-xs sm:flex ${
              apiOnline
                ? "text-[#8b949e]"
                : "text-red-400"
            }`}
          >

            <span
              className={`h-2 w-2 rounded-full ${
                apiOnline
                  ? "bg-green-400"
                  : "bg-red-400"
              }`}
            />

            {apiOnline
              ? "API Connected"
              : "API Offline"}

          </div>

        </div>

      </div>

    </nav>
  );
}