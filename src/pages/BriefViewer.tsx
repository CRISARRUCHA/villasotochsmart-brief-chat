import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, MessageSquare, Paperclip, Download, FileIcon, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import logoHorizontal from "@/assets/logo-horizontal.png";

interface Brief {
  id: string;
  client_name: string | null;
  brief_data: Record<string, any>;
  full_data: Record<string, any> | null;
  chat_history: Array<{ role: string; content: string }>;
  phase: string;
  project: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectInfo {
  name: string;
  primary_color: string | null;
  accent_color: string | null;
}

interface StorageFile {
  name: string;
  url: string;
  size: number;
}

const FIELD_LABELS: Record<string, string> = {
  nombre_negocio: "Nombre del Negocio",
  nombre_contacto: "Nombre del Contacto",
  giro_actividad: "Giro / Actividad",
  objetivo_sitio: "Objetivo del Sitio",
  publico_objetivo: "Público Objetivo",
  competidores_urls: "Competidores / URLs",
  competidores_referencias: "Competidores / Referencias",
  sitios_que_les_gustan: "Sitios que les Gustan",
  tono_personalidad: "Tono y Personalidad",
  diferenciador: "Diferenciador",
  tono_feel: "Tono y Feel",
  identidad_visual: "Identidad Visual",
  secciones_necesarias: "Secciones Necesarias",
  contenido_disponible: "Contenido Disponible",
  llamadas_a_accion: "Llamadas a la Acción",
  redes_sociales: "Redes Sociales",
  referencias_visuales_adicionales: "Referencias Visuales",
  funcionalidades_especiales: "Funcionalidades Especiales",
  idiomas: "Idiomas",
  extras: "Extras",
  nombre_interlocutor: "Nombre del Interlocutor",
  cargo: "Cargo",
  organizacion_interlocutor: "Organización",
  nombre_proyecto: "Nombre del Proyecto",
  objetivos_proyecto: "Objetivos del Proyecto",
  mision_proyecto: "Misión",
  vision_proyecto: "Visión",
  sitio_web_necesario: "¿Sitio Web Necesario?",
  justificacion_sitio_web: "Justificación",
};

const HIDDEN_FIELDS = ["_partial"];

type TabView = "summary" | "chat" | "files";

const phaseBadge: Record<string, { label: string; className: string }> = {
  brief: { label: "Brief", className: "bg-blue-500/10 text-blue-400" },
  full: { label: "Técnico", className: "bg-amber-500/10 text-amber-400" },
  done: { label: "Completo", className: "bg-emerald-500/10 text-emerald-400" },
};

function cleanMessageContent(content: string): string {
  return content
    .replace(/\{"suggestions".*$/s, "")
    .replace(/\{"action".*$/s, "")
    .trim();
}

const BriefViewer = () => {
  const { id } = useParams<{ id: string }>();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabView>("summary");
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data } = await supabase
        .from("briefs")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        const b = data as unknown as Brief;
        setBrief(b);

        // Fetch project info if available
        if (b.project) {
          const { data: pData } = await supabase
            .from("projects")
            .select("name, primary_color, accent_color")
            .eq("slug", b.project)
            .single();
          if (pData) setProject(pData as ProjectInfo);
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  useEffect(() => {
    if (tab === "files" && id && files.length === 0) {
      fetchFiles();
    }
  }, [tab, id]);

  const fetchFiles = async () => {
    if (!id) return;
    setLoadingFiles(true);
    const { data } = await supabase.storage
      .from("brief-files")
      .list(id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

    const result: StorageFile[] = (data || [])
      .filter(f => f.name !== ".emptyFolderPlaceholder")
      .map(f => {
        const { data: urlData } = supabase.storage
          .from("brief-files")
          .getPublicUrl(`${id}/${f.name}`);
        return {
          name: f.name.replace(/^\d+-/, ""),
          url: urlData.publicUrl,
          size: f.metadata?.size || 0,
        };
      });
    setFiles(result);
    setLoadingFiles(false);
  };

  const primaryColor = project?.primary_color || "#1488fc";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 text-white/60">
        <FileText size={40} className="opacity-30" />
        <p className="text-sm">Brief no encontrado</p>
      </div>
    );
  }

  const badge = phaseBadge[brief.phase] || phaseBadge.brief;
  const allData = { ...brief.brief_data, ...(brief.full_data || {}) };
  const displayName = brief.client_name || (brief.brief_data as any)?.nombre_negocio || (brief.brief_data as any)?.nombre_interlocutor || "Brief";
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const formatSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const dataEntries = Object.entries(allData).filter(([key]) => !HIDDEN_FIELDS.includes(key));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center p-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              <img src="/lovable-uploads/icono-blanco.png" alt="" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/40">
                {project?.name || "Brief IA"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
              {badge.label}
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{displayName}</h1>
          <p className="text-sm text-white/40 mt-1.5">{formatDate(brief.updated_at || brief.created_at)}</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex gap-1">
          {([
            { key: "summary" as TabView, label: "Resumen", icon: FileText },
            { key: "chat" as TabView, label: "Conversación", icon: MessageSquare },
            { key: "files" as TabView, label: "Archivos", icon: Paperclip },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-sm px-4 py-3 border-b-2 transition-colors ${
                tab === t.key
                  ? "border-current font-medium"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
              style={tab === t.key ? { color: primaryColor } : undefined}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {tab === "summary" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {dataEntries.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-12">No hay datos de resumen disponibles aún.</p>
            ) : (
              <div className="space-y-6">
                {dataEntries.map(([key, value]) => (
                  <div key={key} className="group">
                    <dt className="text-[11px] font-medium uppercase tracking-wider mb-1.5 font-mono" style={{ color: primaryColor + "99" }}>
                      {FIELD_LABELS[key] || key.replace(/_/g, " ")}
                    </dt>
                    <dd className="text-[15px] text-white/80 leading-relaxed">
                      {Array.isArray(value) ? (
                        <ul className="list-disc list-inside space-y-1">
                          {value.map((v, i) => <li key={i}>{String(v)}</li>)}
                        </ul>
                      ) : typeof value === "string" ? (
                        value
                      ) : (
                        JSON.stringify(value)
                      )}
                    </dd>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === "chat" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {(!brief.chat_history || (brief.chat_history as any[]).length === 0) ? (
              <p className="text-white/40 text-sm text-center py-12">No hay conversación registrada.</p>
            ) : (
              (brief.chat_history as any[]).map((msg, i) => {
                const cleaned = cleanMessageContent(msg.content || "");
                if (!cleaned) return null;
                const isUser = msg.role === "user";
                return (
                  <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        isUser
                          ? "rounded-tr-sm text-white"
                          : "bg-white/[0.04] text-white/80 rounded-tl-sm border border-white/[0.06]"
                      }`}
                      style={isUser ? { backgroundColor: primaryColor } : undefined}
                    >
                      <div className="prose prose-sm prose-invert max-w-none prose-p:my-1">
                        <ReactMarkdown>{cleaned}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        {tab === "files" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {loadingFiles ? (
              <p className="text-white/40 text-sm text-center py-12">Cargando archivos...</p>
            ) : files.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-12">No hay archivos adjuntos.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {files.map((file, i) => {
                  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
                  return (
                    <a
                      key={i}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group border border-white/[0.06] rounded-xl overflow-hidden hover:ring-2 transition-all bg-white/[0.02]"
                      style={{ ["--tw-ring-color" as any]: primaryColor + "40" }}
                    >
                      {isImage ? (
                        <div className="aspect-square bg-white/[0.03]">
                          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="aspect-square bg-white/[0.03] flex items-center justify-center">
                          <FileIcon size={32} className="text-white/20" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-xs font-medium text-white/80 truncate">{file.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-white/30">{formatSize(file.size)}</span>
                          <Download size={11} className="text-white/20 group-hover:text-white/60 transition-colors" />
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] mt-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-center gap-2">
          <img src={logoHorizontal} alt="Im-Pulsa Web" className="h-5 opacity-40" />
        </div>
      </footer>
    </div>
  );
};

export default BriefViewer;
