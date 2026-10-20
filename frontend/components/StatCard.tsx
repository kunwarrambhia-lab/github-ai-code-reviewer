import {
  FileCode2,
  ShieldAlert,
  Bug,
  Gauge,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  type:
    | "files"
    | "security"
    | "bugs"
    | "performance";
}

export default function StatCard({
  title,
  value,
  type,
}: StatCardProps) {

  const icons = {
    files: FileCode2,
    security: ShieldAlert,
    bugs: Bug,
    performance: Gauge,
  };

  const Icon = icons[type];

  const iconStyles = {
    files:
      "text-green-400 bg-green-500/10",

    security:
      "text-red-400 bg-red-500/10",

    bugs:
      "text-orange-400 bg-orange-500/10",

    performance:
      "text-yellow-400 bg-yellow-500/10",
  };

  return (

    <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4 transition hover:border-[#484f58]">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs text-[#8b949e]">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-[#f0f6fc]">
            {value}
          </p>

        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconStyles[type]}`}
        >

          <Icon size={20} />

        </div>

      </div>

    </div>
  );
}