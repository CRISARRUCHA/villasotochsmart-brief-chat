import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Trash2, MessageSquare, FileText, ChevronDown, ChevronUp, User } from "lucide-react";
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
};

const HIDDEN_FIELDS = ["_partial"];

const phaseBadge: Record<string, { label: string; className: string }> = {
  brief: { label: "Brief", className: "bg-primary/10 text-primary" },
  full: { label: "Técnico", className: "bg-phase-tech/10 text-phase-tech" },
  done: { label: "Completo", className: "bg-phase-done/10 text-phase-done" },
};

/** Strip JSON artifacts from AI messages for display */
function cleanMessageContent(content: string): string {
  return content
    .replace(/\{"suggestions".*$/s, "")
    .replace(/\{"action".*$/s, "")
    .trim();
}

type TabView = "summary" | "chat";

const Dashboard = () => {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tabView, setTabView] = useState<Record<string, TabView>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      fetchBriefs();
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
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Error al cargar briefs");
    } else {
      setBriefs((data as unknown as Brief[]) || []);
    }
    setLoading(false);
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
  const setTab = (id: string, tab: TabView) => setTabView(prev => ({ ...prev, [id]: tab }));

  const getDisplayName = (brief: Brief): string => {
    const name = brief.client_name || (brief.brief_data as any)?.nombre_negocio;
    const contact = (brief.brief_data as any)?.nombre_contacto;
    if (name && contact) return `${name} — ${contact}`;
    if (name) return name;
    if (contact) return contact;
    return "Sin nombre";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <span className="text-background text-xs font-semibold">B</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Brief IA</h1>
              <p className="text-xs text-muted-foreground">Briefs recibidos</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">Cargando...</div>
        ) : briefs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">No hay briefs guardados aún.</div>
        ) : (
          <div className="space-y-3">
            {briefs.map(brief => {
              const badge = phaseBadge[brief.phase] || phaseBadge.brief;
              const isExpanded = expandedId === brief.id;
              const currentTab = getTab(brief.id);
              const allData = { ...brief.brief_data, ...(brief.full_data || {}) };

              return (
                <div key={brief.id} className="border border-border rounded-2xl bg-background overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : brief.id)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">
                        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {getDisplayName(brief)}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(brief.created_at)}</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
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
                        <div className="px-4 sm:px-5 pb-5 border-t border-border pt-4">
                          {/* Tabs */}
                          <div className="flex items-center gap-1 mb-4 bg-secondary/50 rounded-lg p-1 w-fit">
                            <button
                              onClick={() => setTab(brief.id, "summary")}
                              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${currentTab === "summary" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              <FileText size={12} /> Resumen
                            </button>
                            <button
                              onClick={() => setTab(brief.id, "chat")}
                              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${currentTab === "chat" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              <MessageSquare size={12} /> Conversación
                            </button>
                          </div>

                          {currentTab === "summary" ? (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                {Object.entries(allData)
                                  .filter(([key]) => !HIDDEN_FIELDS.includes(key))
                                  .map(([key, value]) => (
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
                              {Object.keys(allData).filter(k => !HIDDEN_FIELDS.includes(k)).length === 0 && (
                                <div className="mb-4">
                                  <p className="text-sm text-muted-foreground mb-3">
                                    El brief aún está en proceso — aquí tienes un adelanto de la conversación:
                                  </p>
                                  <div className="space-y-2">
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
                          ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto mb-4 pr-1">
                              {(brief.chat_history as any[])?.map((msg, i) => {
                                const cleaned = cleanMessageContent(msg.content || "");
                                if (!cleaned) return null;
                                return (
                                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-secondary text-foreground rounded-tl-none"}`}>
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
                          )}

                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => deleteBrief(brief.id)}
                              className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors"
                            >
                              <Trash2 size={12} /> Eliminar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
