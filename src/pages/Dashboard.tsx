import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LogOut, Trash2, MessageSquare, FileText, ChevronDown, ChevronUp,
  Paperclip, Download, Image as ImageIcon, FileIcon, Plus, FolderOpen,
  ExternalLink, Copy, Pencil, LayoutGrid, List, Inbox, Hash, CopyPlus,
  Share2, FileDown, FileSpreadsheet
} from "lucide-react";
import { exportProjectBriefsPDF, exportProjectBriefsExcel } from "@/lib/export-briefs";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { CreateProjectChat } from "@/components/dashboard/CreateProjectChat";
import { EditProjectModal } from "@/components/dashboard/EditProjectModal";
import { GradientCard } from "@/components/ui/gradient-card";

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
};

const HIDDEN_FIELDS = ["_partial"];

const phaseBadge: Record<string, { label: string; className: string }> = {
  brief: { label: "Brief", className: "bg-primary/10 text-primary" },
  full: { label: "Técnico", className: "bg-phase-tech/10 text-phase-tech" },
  done: { label: "Completo", className: "bg-phase-done/10 text-phase-done" },
};

function cleanMessageContent(content: string): string {
  return content
    .replace(/\{"suggestions".*$/s, "")
    .replace(/\{"action".*$/s, "")
    .trim();
}

type TabView = "summary" | "chat" | "files";

interface StorageFile {
  name: string;
  url: string;
  size: number;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  prompt: string | null;
  phase1_prompt: string;
  phase2_prompt: string;
  initial_message: string;
  landing_title: string | null;
  landing_subtitle: string | null;
  landing_cta: string | null;
  primary_color: string | null;
  accent_color: string | null;
  show_suggestions: boolean;
  completion_title: string | null;
  completion_subtitle: string | null;
  completion_next_label: string | null;
  completion_next_text: string | null;
  completion_link_url: string | null;
  completion_link_text: string | null;
  created_at: string;
}

const Dashboard = () => {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [expandedBriefId, setExpandedBriefId] = useState<string | null>(null);
  const [tabView, setTabView] = useState<Record<string, TabView>>({});
  const [briefFiles, setBriefFiles] = useState<Record<string, StorageFile[]>>({});
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      fetchBriefs();
      fetchProjects();
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/login");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchBriefs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("briefs")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error("Error al cargar briefs");
    } else {
      setBriefs((data as unknown as Brief[]) || []);
    }
    setLoading(false);
  };

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("id, name, slug, description, prompt, phase1_prompt, phase2_prompt, initial_message, landing_title, landing_subtitle, landing_cta, primary_color, accent_color, show_suggestions, completion_title, completion_subtitle, completion_next_label, completion_next_text, completion_link_url, completion_link_text, created_at")
      .order("created_at", { ascending: false });
    setProjects((data as unknown as Project[]) || []);
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar proyecto");
    } else {
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success("Proyecto eliminado");
    }
  };

  const duplicateProject = async (project: Project) => {
    const newSlug = `${project.slug}-copia-${Date.now().toString(36)}`;
    const { data, error } = await supabase.from("projects").insert({
      name: `${project.name} (copia)`,
      slug: newSlug,
      description: project.description,
      prompt: project.prompt,
      phase1_prompt: project.phase1_prompt,
      phase2_prompt: project.phase2_prompt,
      initial_message: project.initial_message,
      landing_title: project.landing_title,
      landing_subtitle: project.landing_subtitle,
      landing_cta: project.landing_cta,
      primary_color: project.primary_color,
      accent_color: project.accent_color,
      show_suggestions: project.show_suggestions,
      completion_title: project.completion_title,
      completion_subtitle: project.completion_subtitle,
      completion_next_label: project.completion_next_label,
      completion_next_text: project.completion_next_text,
      completion_link_url: project.completion_link_url,
      completion_link_text: project.completion_link_text,
    }).select().single();
    if (error) {
      toast.error("Error al duplicar proyecto");
    } else {
      setProjects(prev => [data as unknown as Project, ...prev]);
      toast.success("Proyecto duplicado");
    }
  };

  const deleteBrief = async (id: string) => {
    const { error } = await supabase.from("briefs").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar");
    } else {
      setBriefs(prev => prev.filter(b => b.id !== id));
      toast.success("Brief eliminado");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const getTab = (id: string): TabView => tabView[id] || "summary";
  const setTab = (id: string, tab: TabView) => {
    setTabView(prev => ({ ...prev, [id]: tab }));
    if (tab === "files" && !briefFiles[id]) {
      fetchFiles(id);
    }
  };

  const fetchFiles = async (briefId: string) => {
    setLoadingFiles(prev => ({ ...prev, [briefId]: true }));
    const { data, error } = await supabase.storage
      .from("brief-files")
      .list(briefId, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

    if (error) {
      setLoadingFiles(prev => ({ ...prev, [briefId]: false }));
      return;
    }

    const files: StorageFile[] = (data || [])
      .filter(f => f.name !== ".emptyFolderPlaceholder")
      .map(f => {
        const { data: urlData } = supabase.storage
          .from("brief-files")
          .getPublicUrl(`${briefId}/${f.name}`);
        return {
          name: f.name.replace(/^\d+-/, ""),
          url: urlData.publicUrl,
          size: f.metadata?.size || 0,
          created_at: f.created_at || "",
        };
      });

    setBriefFiles(prev => ({ ...prev, [briefId]: files }));
    setLoadingFiles(prev => ({ ...prev, [briefId]: false }));
  };

  const getDisplayName = (brief: Brief): string => {
    const name = brief.client_name || (brief.brief_data as any)?.nombre_negocio;
    const contact = (brief.brief_data as any)?.nombre_contacto;
    if (name && contact) return `${name} — ${contact}`;
    if (name) return name;
    if (contact) return contact;
    return "Sin nombre";
  };

  const copyProjectUrl = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("URL copiada al portapapeles");
  };

  // Group briefs by project slug
  const getBriefsForProject = (slug: string) =>
    briefs.filter(b => b.project === slug);

  const orphanBriefs = briefs.filter(b => !b.project || !projects.some(p => p.slug === b.project));

  const renderBriefCard = (brief: Brief) => {
    const badge = phaseBadge[brief.phase] || phaseBadge.brief;
    const isExpanded = expandedBriefId === brief.id;
    const currentTab = getTab(brief.id);
    const allData = { ...brief.brief_data, ...(brief.full_data || {}) };

    return (
      <div key={brief.id} className="border border-border/50 rounded-xl bg-secondary/20 overflow-hidden">
        <button
          onClick={() => setExpandedBriefId(isExpanded ? null : brief.id)}
          className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-secondary/40 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${badge.className}`}>
              {badge.label}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{getDisplayName(brief)}</p>
              <p className="text-[11px] text-muted-foreground">{formatDate(brief.updated_at || brief.created_at)}</p>
            </div>
          </div>
          {isExpanded ? <ChevronUp size={14} className="text-muted-foreground shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 sm:px-4 pb-4 border-t border-border/30 pt-3">
                {/* Tabs */}
                <div className="flex items-center gap-1 mb-3 bg-secondary/50 rounded-lg p-0.5 w-fit">
                  <button
                    onClick={() => setTab(brief.id, "summary")}
                    className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md transition-colors ${currentTab === "summary" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <FileText size={11} /> Resumen
                  </button>
                  <button
                    onClick={() => setTab(brief.id, "chat")}
                    className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md transition-colors ${currentTab === "chat" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <MessageSquare size={11} /> Conversación
                  </button>
                  <button
                    onClick={() => setTab(brief.id, "files")}
                    className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md transition-colors ${currentTab === "files" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Paperclip size={11} /> Archivos
                  </button>
                </div>

                {currentTab === "summary" ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      {Object.entries(allData)
                        .filter(([key]) => !HIDDEN_FIELDS.includes(key))
                        .map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5 font-mono">
                            {FIELD_LABELS[key] || key}
                          </dt>
                          <dd className="text-sm text-foreground leading-snug">
                            {typeof value === "string" ? value : JSON.stringify(value)}
                          </dd>
                        </div>
                      ))}
                    </div>
                    {Object.keys(allData).filter(k => !HIDDEN_FIELDS.includes(k)).length === 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-2">
                          El brief aún está en proceso — adelanto de la conversación:
                        </p>
                        <div className="space-y-1.5">
                          {(brief.chat_history as any[])
                            ?.filter((msg: any) => msg.role === "user")
                            .slice(0, 3)
                            .map((msg: any, i: number) => (
                              <p key={i} className="text-sm text-foreground bg-secondary/50 rounded-lg px-3 py-2">
                                {cleanMessageContent(msg.content || "").substring(0, 150)}
                              </p>
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : currentTab === "chat" ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto mb-3 pr-1">
                    {(brief.chat_history as any[])?.map((msg, i) => {
                      const cleaned = cleanMessageContent(msg.content || "");
                      if (!cleaned) return null;
                      return (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-secondary text-foreground rounded-tl-none"}`}>
                            <div className="prose prose-sm prose-invert max-w-none prose-p:my-1">
                              <ReactMarkdown>{cleaned}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {(!brief.chat_history || (brief.chat_history as any[]).length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">No hay conversación registrada.</p>
                    )}
                  </div>
                ) : (
                  <div className="mb-3">
                    {loadingFiles[brief.id] ? (
                      <p className="text-sm text-muted-foreground text-center py-6">Cargando archivos...</p>
                    ) : !briefFiles[brief.id] || briefFiles[brief.id].length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No hay archivos adjuntos.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {briefFiles[brief.id].map((file, i) => {
                          const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
                          const formatSize = (bytes: number) => {
                            if (!bytes) return "";
                            if (bytes < 1024) return `${bytes} B`;
                            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
                            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                          };
                          return (
                            <a key={i} href={file.url} target="_blank" rel="noopener noreferrer"
                              className="group border border-border/50 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/30 transition-all"
                            >
                              {isImage ? (
                                <div className="aspect-square bg-secondary/50">
                                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="aspect-square bg-secondary/50 flex items-center justify-center">
                                  <FileIcon size={28} className="text-muted-foreground" />
                                </div>
                              )}
                              <div className="p-2">
                                <p className="text-[11px] font-medium text-foreground truncate">{file.name}</p>
                                <div className="flex items-center justify-between mt-0.5">
                                  <span className="text-[10px] text-muted-foreground">{formatSize(file.size)}</span>
                                  <Download size={10} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/brief/${brief.id}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Enlace del brief copiado");
                    }}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink size={11} /> Compartir
                  </button>
                  <button
                    onClick={() => deleteBrief(brief.id)}
                    className="flex items-center gap-1 text-[11px] text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <Trash2 size={11} /> Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderProjectCard = (project: Project) => {
    const projectBriefs = getBriefsForProject(project.slug);
    const isExpanded = expandedProjectId === project.id;
    const color = project.primary_color || "hsl(var(--primary))";

    return (
      <GradientCard
        key={project.id}
        glowColor={color}
      >

        <div className="p-4 sm:p-5 group">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-foreground truncate">{project.name}</h3>
                {projectBriefs.length > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                    <Hash size={9} /> {projectBriefs.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{project.description || "Sin descripción"}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">/p/{project.slug}</p>
            </div>

            <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
              <button onClick={() => copyProjectUrl(project.slug)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary" title="Copiar URL">
                <Share2 size={13} />
              </button>
              <a 
                href={`/p/${project.slug}/briefs`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary" 
                title="Ver todos los briefs"
              >
                <FolderOpen size={13} />
              </a>
              <button onClick={() => setEditingProject(project)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary" title="Editar">
                <Pencil size={13} />
              </button>
              <button onClick={() => duplicateProject(project)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary" title="Duplicar">
                <CopyPlus size={13} />
              </button>
              <button
                onClick={async () => {
                  if (projectBriefs.length === 0) { toast.error("Este proyecto no tiene briefs aún"); return; }
                  await exportProjectBriefsPDF({ name: project.name, slug: project.slug }, projectBriefs as any);
                  toast.success("PDF exportado");
                }}
                className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary"
                title="Exportar PDF"
              >
                <FileDown size={13} />
              </button>
              <button
                onClick={() => {
                  if (projectBriefs.length === 0) { toast.error("Este proyecto no tiene briefs aún"); return; }
                  exportProjectBriefsExcel({ name: project.name, slug: project.slug }, projectBriefs as any);
                  toast.success("Excel exportado");
                }}
                className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary"
                title="Exportar Excel"
              >
                <FileSpreadsheet size={13} />
              </button>
              <a href={`/p/${project.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary" title="Abrir landing">
                <ExternalLink size={13} />
              </a>
              <button onClick={() => deleteProject(project.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-secondary" title="Eliminar">
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Briefs toggle */}
          {projectBriefs.length > 0 && (
            <button
              onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
              className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Inbox size={12} />
              Ver {projectBriefs.length} brief{projectBriefs.length > 1 ? "s" : ""}
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        {/* Briefs nested inside */}
        <AnimatePresence>
          {isExpanded && projectBriefs.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-5 pb-4 space-y-2 border-t border-border/50 pt-3">
                {projectBriefs.map(brief => renderBriefCard(brief))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GradientCard>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 px-3 rounded-lg bg-foreground flex items-center justify-center">
              <span className="text-background text-xs font-semibold whitespace-nowrap">Im-Pulsa Web</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Brief IA</h1>
              <p className="text-xs text-muted-foreground">Panel de administración</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Top bar with actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Proyectos</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{projects.length} proyecto{projects.length !== 1 ? "s" : ""} · {briefs.length} brief{briefs.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-secondary/50 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutGrid size={14} />
              </button>
            </div>
            <button
              onClick={() => setShowCreateProject(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
            >
              <Plus size={14} /> Nuevo proyecto
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">Cargando...</div>
        ) : projects.length === 0 && briefs.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">No hay proyectos aún. Crea uno para empezar.</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
            {projects.map(project => renderProjectCard(project))}

            {/* Orphan briefs */}
            {orphanBriefs.length > 0 && (
              <div className={viewMode === "grid" ? "md:col-span-2" : ""}>
                <div className="border border-dashed border-border rounded-2xl bg-background overflow-hidden">
                  <div className="h-1 w-full bg-muted-foreground/20" />
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Inbox size={14} className="text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-muted-foreground">Briefs sin proyecto</h3>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {orphanBriefs.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {orphanBriefs.map(brief => renderBriefCard(brief))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showCreateProject && (
        <CreateProjectChat
          onProjectCreated={() => { setShowCreateProject(false); fetchProjects(); }}
          onClose={() => setShowCreateProject(false)}
        />
      )}

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onSaved={() => { setEditingProject(null); fetchProjects(); }}
          onClose={() => setEditingProject(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
