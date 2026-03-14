import { motion } from "framer-motion";
import type { Phase } from "@/lib/chat-stream";

const phaseConfig = {
  brief: { label: "Brief", subtitle: "Fase 1 — Brief Preliminar", colorClass: "bg-phase-brief" },
  full: { label: "Técnico", subtitle: "Fase 2 — Levantamiento Técnico", colorClass: "bg-phase-tech" },
  done: { label: "Completo", subtitle: "Brief completado", colorClass: "bg-phase-done" },
};

const badgeColorClass = {
  brief: "bg-phase-brief/10 text-phase-brief",
  full: "bg-phase-tech/10 text-phase-tech",
  done: "bg-phase-done/10 text-phase-done",
};

interface ChatHeaderProps {
  phase: Phase;
  progress: number;
}

export const ChatHeader = ({ phase, progress }: ChatHeaderProps) => {
  const config = phaseConfig[phase];

  return (
    <header className="relative px-4 sm:px-6 py-4 border-b border-border bg-background z-10">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <span className="text-background text-xs font-semibold">B</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Brief IA</h1>
            <p className="text-xs text-muted-foreground">{config.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium tabular-nums text-muted-foreground">{progress}%</span>
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${badgeColorClass[phase]}`}>
            {config.label}
          </span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-secondary">
        <motion.div
          className={`h-full ${config.colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </header>
  );
};
