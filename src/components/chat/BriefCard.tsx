import { motion } from "framer-motion";
import { ArrowRight, Copy, Check } from "lucide-react";
import { useState } from "react";

const FIELD_LABELS: Record<string, string> = {
  nombre_negocio: "Nombre del Negocio",
  giro_actividad: "Giro / Actividad",
  objetivo_sitio: "Objetivo del Sitio",
  publico_objetivo: "Público Objetivo",
  competidores_referencias: "Competidores / Referencias",
  diferenciador: "Diferenciador",
  tono_feel: "Tono y Feel",
  identidad_visual: "Identidad Visual",
  secciones_necesarias: "Secciones Necesarias",
  plazo: "Plazo",
  dominio_hosting: "Dominio y Hosting",
  plataforma_preferida: "Plataforma Preferida",
  funcionalidades_especificas: "Funcionalidades",
  idiomas: "Idiomas",
  estado_contenido: "Estado del Contenido",
  seo: "SEO",
  analiticas: "Analíticas",
  redes_sociales: "Redes Sociales",
  presupuesto: "Presupuesto",
  mantenimiento: "Mantenimiento",
  extras: "Extras",
};

interface BriefCardProps {
  title: string;
  data: Record<string, any>;
  onContinue?: () => void;
  showContinue?: boolean;
}

export const BriefCard = ({ title, data, onContinue, showContinue }: BriefCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = Object.entries(data)
      .map(([k, v]) => `${FIELD_LABELS[k] || k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="bg-background border border-border rounded-2xl p-6 shadow-card ml-10"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
        <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key}>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5 font-mono">
              {FIELD_LABELS[key] || key}
            </dt>
            <dd className="text-sm text-foreground leading-snug">
              {typeof value === "string" ? value : JSON.stringify(value)}
            </dd>
          </div>
        ))}
      </div>
      {showContinue && onContinue && (
        <button
          onClick={onContinue}
          className="mt-5 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Continuar con levantamiento técnico
          <ArrowRight size={16} />
        </button>
      )}
    </motion.div>
  );
};
