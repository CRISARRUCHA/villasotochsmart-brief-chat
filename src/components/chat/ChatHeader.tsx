import { motion } from "framer-motion";
import type { Phase } from "@/lib/chat-stream";


const phaseConfig = {
  brief: { label: "Brief", subtitle: "Fase 1 — Conociendo tu negocio", colorClass: "bg-primary" },
  full: { label: "Contenido", subtitle: "Fase 2 — Contenido y diseño", colorClass: "bg-phase-tech" },
  done: { label: "Completo", subtitle: "Brief completado", colorClass: "bg-phase-done" },
};

const badgeColorClass = {
  brief: "bg-primary/15 text-primary",
  full: "bg-phase-tech/15 text-phase-tech",
  done: "bg-phase-done/15 text-phase-done",
};

interface ChatHeaderProps {
  phase: Phase;
  progress: number;
}

export const ChatHeader = ({ phase, progress }: ChatHeaderProps) => {
  const config = phaseConfig[phase];

  return (
    <header className="relative px-4 sm:px-6 py-4 border-b border-border bg-card z-10">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_12px_rgba(20,136,252,0.4)] p-1.5">
            <img src="/lovable-uploads/icono-blanco.png" alt="Im-Pulsa Web" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Im-Pulsa Web</h1>
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
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-border">
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
