"use client";

import {
  ShieldAlert,
  Gauge,
  Bug,
  CheckCircle,
} from "lucide-react";

interface AnalysisCardProps {
  title: string;
  content: string;
  type: "security" | "performance" | "bugs" | "best-practices";
}

const cardConfig = {
  security: {
    icon: ShieldAlert,
    iconColor: "text-red-400",
    borderColor: "border-red-500/30",
    titleColor: "text-red-400",
  },

  performance: {
    icon: Gauge,
    iconColor: "text-orange-400",
    borderColor: "border-orange-500/30",
    titleColor: "text-orange-400",
  },

  bugs: {
    icon: Bug,
    iconColor: "text-purple-400",
    borderColor: "border-purple-500/30",
    titleColor: "text-purple-400",
  },

  "best-practices": {
    icon: CheckCircle,
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/30",
    titleColor: "text-blue-400",
  },
};

export default function AnalysisCard({
  title,
  content,
  type,
}: AnalysisCardProps) {
  const config = cardConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`bg-[#161b22] border ${config.borderColor} rounded-xl p-5`}
    >
      <div className="flex items-center gap-3 mb-4">
        <Icon size={22} className={config.iconColor} />

        <h3 className={`text-lg font-semibold ${config.titleColor}`}>
          {title}
        </h3>
      </div>

      <p className="text-gray-300 text-sm leading-6 whitespace-pre-line">
        {content}
      </p>
    </div>
  );
}