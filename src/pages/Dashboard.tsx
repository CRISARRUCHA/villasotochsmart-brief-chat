import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Trash2, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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

const phaseBadge: Record<string, { label: string; className: string }> = {
  brief: { label: "Brief", className: "bg-primary/10 text-primary" },
  full: { label: "Técnico", className: "bg-phase-tech/10 text-phase-tech" },
  done: { label: "Completo", className: "bg-phase-done/10 text-phase-done" },
};

const Dashboard = () => {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewChat, setViewChat] = useState<string | null>(null);
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
              const showingChat = viewChat === brief.id;
              const data = { ...brief.brief_data, ...(brief.full_data || {}) };

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
                          {brief.client_name || (brief.brief_data as any)?.nombre_negocio || "Sin nombre"}
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
                          {!showingChat ? (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setViewChat(brief.id)}
                                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <Eye size={12} /> Ver conversación
                                </button>
                                <button
                                  onClick={() => deleteBrief(brief.id)}
                                  className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors ml-auto"
                                >
                                  <Trash2 size={12} /> Eliminar
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                                {(brief.chat_history as any[]).map((msg, i) => (
                                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                                      {msg.content?.substring(0, 500)}{msg.content?.length > 500 ? "..." : ""}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => setViewChat(null)}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                ← Volver al brief
                              </button>
                            </>
                          )}
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
