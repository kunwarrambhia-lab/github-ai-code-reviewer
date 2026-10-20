
export interface Finding {
  title: string;
  category: string;
  severity: string;
  file: string;
  evidence: string;
  impact: string;
  recommendation: string;
}

interface FindingCardProps {
  finding: Finding;
}

const severityStyles: Record<string, string> = {
  Critical:
    "border-red-500/40 bg-red-500/15 text-red-300",
  High:
    "border-orange-500/40 bg-orange-500/15 text-orange-300",
  Medium:
    "border-yellow-500/40 bg-yellow-500/15 text-yellow-300",
  Low:
    "border-blue-500/40 bg-blue-500/15 text-blue-300",
};

function getSeverityStyle(severity: string) {
  return (
    severityStyles[severity] ??
    "border-gray-500/40 bg-gray-500/15 text-gray-300"
  );
}

export default function FindingCard({
  finding,
}: FindingCardProps) {
  const severity = finding.severity || "Unknown";
  const category = finding.category || "General";
  const file = finding.file || "File not specified";

  return (
    <article className="overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22]">
      <div className="border-b border-[#30363d] p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSeverityStyle(
              severity
            )}`}
          >
            {severity}
          </span>

          <span className="rounded-full border border-[#30363d] bg-[#0d1117] px-3 py-1 text-xs text-gray-300">
            {category}
          </span>
        </div>

        <h3 className="mt-3 break-words text-base font-semibold text-[#f0f6fc] sm:text-lg">
          {finding.title || "Untitled finding"}
        </h3>

        <div className="mt-3 flex items-start gap-2 text-sm text-gray-400">
          <span className="shrink-0 font-medium text-gray-300">
            File:
          </span>
          <span className="break-all">{file}</span>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <section>
          <h4 className="text-sm font-semibold text-[#f0f6fc]">
            Code Evidence
          </h4>

          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-[#30363d] bg-[#0d1117] p-3 font-mono text-xs leading-5 text-gray-300 sm:text-sm">
            {finding.evidence || "No code evidence provided."}
          </pre>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-[#f0f6fc]">
            Potential Impact
          </h4>

          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-400">
            {finding.impact || "No impact details provided."}
          </p>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-green-400">
            Recommended Fix
          </h4>

          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-300">
            {finding.recommendation ||
              "No recommendation provided."}
          </p>
        </section>
      </div>
    </article>
  );
}
