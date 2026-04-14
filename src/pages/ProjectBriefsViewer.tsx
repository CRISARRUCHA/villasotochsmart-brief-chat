import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Briefcase, Calendar, Hash, MessageSquare, FileText, 
  Paperclip, Download, ExternalLink, ChevronDown,
  Image as ImageIcon, FileIcon, Building2, User, Target, 
  Eye, Lightbulb, Globe, Megaphone, Palette, Layout, 
  Type, Sparkles, Languages, Copy, LayoutGrid, List
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

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

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  primary_color: string | null;
  landing_title: string | null;
  landing_subtitle: string | null;
}

interface StorageFile {
  name: string;
  url: string;
  size: number;
  created_at: string;
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
  nombre_proyecto: "Nombre del Proyecto",
  objetivos_proyecto: "Objetivos del Proyecto",
  mision_proyecto: "Misión",
  vision_proyecto: "Visión",
  sitio_web_necesario: "¿Sitio Web Necesario?",
  justificacion_sitio_web: "Justificación",
  organizacion_interlocutor: "Organización",
  cargo: "Cargo/Rol",
  nombre_interlocutor: "Nombre del Interlocutor",
};

const FIELD_ICONS: Record<string, any> = {
  nombre_negocio: Building2,
  nombre_contacto: User,
  giro_actividad: Briefcase,
  objetivo_sitio: Target,
  publico_objetivo: Eye,
  competidores_urls: ExternalLink,
  sitios_que_les_gustan: Globe,
  tono_personalidad: Sparkles,
  tono_feel: Palette,
  identidad_visual: Palette,
  secciones_necesarias: Layout,
  llamadas_a_accion: Megaphone,
  redes_sociales: Globe,
  idiomas: Languages,
  nombre_proyecto: Lightbulb,
  objetivos_proyecto: Target,
  mision_proyecto: Sparkles,
  vision_proyecto: Eye,
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-MX", { 
    day: "numeric", 
    month: "short", 
    year: "numeric" 
  });
}

type ViewMode = "grid" | "list";

export default function ProjectBriefsViewer() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [project, setProject] = useState<Project | null>(null);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBriefId, setExpandedBriefId] = useState<string | null>(null);
  const [briefFiles, setBriefFiles] = useState<Record<string, StorageFile[]>>({});
  const [activeTab, setActiveTab] = useState<"summary" | "chat" | "files">("summary");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    if (slug) {
      fetchProjectAndBriefs();
    }
  }, [slug]);

  const fetchProjectAndBriefs = async () => {
    try {
      setLoading(true);
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, name, slug, description, primary_color, landing_title, landing_subtitle")
        .eq("slug", slug)
        .single();
        
      if (projectError || !projectData) {
        setError("Proyecto no encontrado");
        return;
      }
      
      setProject(projectData as unknown as Project);
      
      const { data: briefsData, error: briefsError } = await supabase
        .from("briefs")
        .select("*")
        .eq("project", slug)
        .order("created_at", { ascending: false });
        
      if (briefsError) {
        setError("Error al cargar los briefs");
        return;
      }
      
      setBriefs((briefsData as unknown as Brief[]) || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchBriefFiles = async (briefId: string) => {
    try {
      const { data, error } = await supabase.storage.from("brief-files").list(briefId);
      if (error || !data || data.length === 0) {
        setBriefFiles(prev => ({ ...prev, [briefId]: [] }));
        return;
      }
      const filesWithUrls = await Promise.all(
        data
          .filter(file => file.name !== ".emptyFolderPlaceholder")
          .map(async (file) => {
            const { data: urlData } = await supabase.storage
              .from("brief-files")
              .createSignedUrl(`${briefId}/${file.name}`, 3600);
            return {
              name: file.name,
              size: file.metadata?.size || 0,
              created_at: file.created_at,
              url: urlData?.signedUrl || "",
            };
          })
      );
      setBriefFiles(prev => ({ ...prev, [briefId]: filesWithUrls }));
    } catch {
      setBriefFiles(prev => ({ ...prev, [briefId]: [] }));
    }
  };

  const handleExpandBrief = (briefId: string) => {
    if (expandedBriefId === briefId) {
      setExpandedBriefId(null);
    } else {
      setExpandedBriefId(briefId);
      if (!briefFiles[briefId]) {
        fetchBriefFiles(briefId);
      }
    }
  };

  const copyShareUrl = () => {
    const url = token 
      ? `${window.location.origin}/p/${slug}/briefs?token=${token}`
      : `${window.location.origin}/p/${slug}/briefs`;
    navigator.clipboard.writeText(url);
    toast.success("Enlace copiado al portapapeles");
  };

  const primaryColor = project?.primary_color || "hsl(var(--primary))";

  const phaseBadge = (phase: string) => {
    if (phase === "done") return { label: "Completo", cls: "bg-green-500/20 text-green-400" };
    if (phase === "full") return { label: "Fase 2", cls: "bg-amber-500/20 text-amber-400" };
    return { label: "Fase 1", cls: "bg-blue-500/20 text-blue-400" };
  };

  const renderBriefSummary = (brief: Brief) => {
    const data = brief.brief_data || {};
    const fullData = brief.full_data || {};
    const allFields = { ...data, ...fullData };
    const visibleFields = Object.entries(allFields).filter(
      ([key, value]) => value && value !== "" && !key.startsWith("_")
    );

    if (visibleFields.length === 0) {
      return <p className="text-sm text-muted-foreground italic">No hay datos disponibles en el resumen.</p>;
    }

    return (
      <div className="grid gap-3">
        {visibleFields.map(([key, value]) => {
          const Icon = FIELD_ICONS[key] || FileText;
          const label = FIELD_LABELS[key] || key;
          return (
            <div key={key} className="flex gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <div className="shrink-0 mt-0.5">
                <Icon size={16} style={{ color: primaryColor }} className="opacity-70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
                <div className="text-sm text-foreground">
                  {Array.isArray(value) ? (
                    <ul className="list-disc list-inside space-y-1">
                      {value.map((item, i) => <li key={i}>{String(item)}</li>)}
                    </ul>
                  ) : (
                    <p className="whitespace-pre-wrap">{String(value)}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderBriefChat = (brief: Brief) => {
    const chatHistory = brief.chat_history || [];
    if (chatHistory.length === 0) {
      return <p className="text-sm text-muted-foreground italic">No hay conversación disponible.</p>;
    }
    return (
      <div className="space-y-4">
        {chatHistory.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                isUser 
                  ? "rounded-br-sm text-white" 
                  : "bg-white/[0.05] text-foreground rounded-bl-sm border border-white/[0.06]"
              }`} style={isUser ? { background: primaryColor } : undefined}>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderBriefFiles = (brief: Brief) => {
    const files = briefFiles[brief.id] || [];
    if (files.length === 0) {
      return <p className="text-sm text-muted-foreground italic">No hay archivos adjuntos.</p>;
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {files.map((file) => {
          const isImage = file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
          return (
            <a
              key={file.name}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.15] transition-colors bg-white/[0.03]"
            >
              {isImage ? (
                <div className="aspect-square bg-black/20">
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-square bg-white/[0.02] flex items-center justify-center">
                  <FileIcon size={32} className="text-muted-foreground" />
                </div>
              )}
              <div className="p-2">
                <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">{formatSize(file.size)}</span>
                  <Download size={12} className="text-muted-foreground group-hover:text-white transition-colors" />
                </div>
              </div>
            </a>
          );
        })}
      </div>
    );
  };

  // Expanded content for a brief (used in both views)
  const renderExpandedContent = (brief: Brief) => (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-t border-white/[0.06]"
    >
      <div className="p-4">
        <div className="flex gap-1 mb-4 p-1 bg-white/[0.04] rounded-lg border border-white/[0.06]">
          {(["summary", "chat", "files"] as const).map((tab) => {
            const icons = { summary: FileText, chat: MessageSquare, files: Paperclip };
            const labels = { summary: "Resumen", chat: "Conversación", files: "Archivos" };
            const Icon = icons[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-white/[0.08] text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={12} />
                {labels[tab]}
              </button>
            );
          })}
        </div>
        <div className="min-h-[200px]">
          {activeTab === "summary" && renderBriefSummary(brief)}
          {activeTab === "chat" && renderBriefChat(brief)}
          {activeTab === "files" && renderBriefFiles(brief)}
        </div>
        <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-muted-foreground">ID: {brief.id.slice(0, 8)}...</span>
          <a
            href={`/brief/${brief.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs hover:underline"
            style={{ color: primaryColor }}
          >
            <ExternalLink size={12} />
            Ver brief individual
          </a>
        </div>
      </div>
    </motion.div>
  );

  // Grid card for a brief
  const renderGridCard = (brief: Brief, index: number) => {
    const isExpanded = expandedBriefId === brief.id;
    const badge = phaseBadge(brief.phase);
    const dataKeys = Object.keys({ ...brief.brief_data, ...brief.full_data }).filter(
      k => !k.startsWith("_") && (brief.brief_data?.[k] || brief.full_data?.[k])
    );

    return (
      <motion.div
        key={brief.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#161616] via-[#111111] to-[#0a0a0a]"
      >
        {/* Noise texture */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.04] mix-blend-overlay rounded-2xl"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
          }}
        />
        {/* Bottom glow */}
        <div
          className="pointer-events-none absolute z-[1] rounded-2xl"
          style={{
            width: "120%",
            height: "50%",
            bottom: "-10%",
            left: "-10%",
            background: `radial-gradient(ellipse at 50% 90%, ${primaryColor}22 0%, transparent 70%)`,
            filter: "blur(10px)",
          }}
        />
        {/* Bottom border glow */}
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-[3]"
          style={{
            width: "50%",
            height: "1px",
            background: `linear-gradient(90deg, transparent, ${primaryColor}55, transparent)`,
          }}
        />

        <div className="relative z-[5]">
          <button
            onClick={() => handleExpandBrief(brief.id)}
            className="w-full p-5 text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${primaryColor}18` }}
                >
                  <Briefcase size={18} style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    {brief.client_name || `Brief ${index + 1}`}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar size={10} />
                      {formatDate(brief.created_at)}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronDown
                size={16}
                className={`text-muted-foreground transition-transform mt-1 ${isExpanded ? "rotate-180" : ""}`}
              />
            </div>
            {/* Preview: show first 2-3 field values */}
            {!isExpanded && dataKeys.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {dataKeys.slice(0, 3).map(key => (
                  <span key={key} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-muted-foreground border border-white/[0.06]">
                    {FIELD_LABELS[key] || key}
                  </span>
                ))}
                {dataKeys.length > 3 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-muted-foreground">
                    +{dataKeys.length - 3}
                  </span>
                )}
              </div>
            )}
          </button>

          <AnimatePresence>
            {isExpanded && renderExpandedContent(brief)}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  // List row for a brief
  const renderListRow = (brief: Brief, index: number) => {
    const isExpanded = expandedBriefId === brief.id;
    const badge = phaseBadge(brief.phase);

    return (
      <motion.div
        key={brief.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#161616] via-[#111111] to-[#0a0a0a]"
      >
        {/* Noise */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.04] mix-blend-overlay rounded-2xl"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
          }}
        />

        <div className="relative z-[5]">
          <button
            onClick={() => handleExpandBrief(brief.id)}
            className="w-full p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${primaryColor}18` }}
              >
                <Briefcase size={20} style={{ color: primaryColor }} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {brief.client_name || `Brief ${index + 1}`}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {formatDate(brief.created_at)}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
            </div>
            <ChevronDown
              size={18}
              className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {isExpanded && renderExpandedContent(brief)}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] via-[#0a0a0a] to-[#060606] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: `${primaryColor}`, borderTopColor: 'transparent' }} />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] via-[#0a0a0a] to-[#060606] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <FileText size={24} className="text-destructive" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">
            {error || "Proyecto no encontrado"}
          </h1>
          <p className="text-sm text-muted-foreground">
            El proyecto que buscas no existe o no tienes acceso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] via-[#0a0a0a] to-[#060606] relative">
      {/* Noise texture */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />
      {/* Aurora glows */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-0 h-[40vh]">
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 50% 100%, ${primaryColor}15 0%, transparent 70%)` }}
        />
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 30% 100%, rgba(56, 189, 248, 0.08) 0%, transparent 60%)` }}
        />
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 70% 100%, rgba(168, 85, 247, 0.08) 0%, transparent 60%)` }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {project.landing_title || project.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {project.landing_subtitle || project.description || "Briefs del proyecto"}
              </p>
            </div>
            <button
              onClick={copyShareUrl}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] transition-colors text-sm font-medium shrink-0 border border-white/[0.06]"
            >
              <Copy size={14} />
              Copiar enlace
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Briefcase size={12} />
                <span>{briefs.length} brief{briefs.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Hash size={12} />
                <span>/{slug}</span>
              </div>
            </div>
            {/* View mode toggle */}
            <div className="flex items-center gap-1 p-1 bg-white/[0.04] rounded-lg border border-white/[0.06]">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "grid" ? "bg-white/[0.1] text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Cuadrícula"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "list" ? "bg-white/[0.1] text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Lista"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {briefs.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={40} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No hay briefs en este proyecto aún.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {briefs.map((brief, index) => renderGridCard(brief, index))}
          </div>
        ) : (
          <div className="space-y-3">
            {briefs.map((brief, index) => renderListRow(brief, index))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] mt-16">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Powered by Im-Pulsa · Agencia de Automatizaciones y Tecnología</span>
            <span>{new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
