import { useState, useRef, useCallback } from "react";
import { X, Save, Sparkles, SendHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface ProjectData {
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
}

interface EditProjectModalProps {
  project: ProjectData;
  onSaved: () => void;
  onClose: () => void;
}

type EditMode = "manual" | "ai";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const EditProjectModal = ({ project, onSaved, onClose }: EditProjectModalProps) => {
  const [mode, setMode] = useState<EditMode>("manual");
  const [form, setForm] = useState({ ...project });
  const [saving, setSaving] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `📝 **Editando "${project.name}"**\n\nDime qué quieres cambiar. Puedo modificar el prompt, el mensaje inicial, la landing page, los colores, o cualquier otro aspecto del proyecto.` },
  ]);
  const [apiMessages, setApiMessages] = useState<Array<{ role: string; content: string }>>([
    { role: "assistant", content: `Editando "${project.name}". Dime qué quieres cambiar.` },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  const cleanDisplay = (text: string) =>
    text.replace(/\{"suggestions".*$/s, "").replace(/\{"action".*$/s, "").trim();

  const toggleField = (field: string) => {
    setExpandedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const isSinglePhase = !!form.prompt;

  const handleManualSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        initial_message: form.initial_message,
        landing_title: form.landing_title,
        landing_subtitle: form.landing_subtitle,
        landing_cta: form.landing_cta,
        primary_color: form.primary_color,
        accent_color: form.accent_color,
        show_suggestions: form.show_suggestions,
      };

      if (isSinglePhase) {
        updateData.prompt = form.prompt;
        updateData.phase1_prompt = form.prompt || "";
        updateData.phase2_prompt = form.phase2_prompt;
      } else {
        updateData.phase1_prompt = form.phase1_prompt;
        updateData.phase2_prompt = form.phase2_prompt;
      }

      const { error } = await supabase.from("projects").update(updateData).eq("id", project.id);

      if (error) {
        if (error.code === "23505") toast.error("Ya existe un proyecto con ese slug");
        else toast.error("Error al guardar");
        return;
      }
      toast.success("Proyecto actualizado");
      onSaved();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const applyUpdates = async (updates: Record<string, any>) => {
    const isSinglePhaseProject = !!form.prompt;
    const newForm = { ...form };

    if (updates.name) newForm.name = updates.name;
    if (updates.slug) newForm.slug = updates.slug;
    if (updates.description !== undefined) newForm.description = updates.description;

    if (isSinglePhaseProject) {
      const nextPrompt = updates.prompt ?? updates.phase1_prompt;
      if (typeof nextPrompt === "string" && nextPrompt.trim()) {
        newForm.prompt = nextPrompt;
        newForm.phase1_prompt = nextPrompt;
      }
    } else {
      if (updates.phase1_prompt) newForm.phase1_prompt = updates.phase1_prompt;
      if (updates.phase2_prompt) newForm.phase2_prompt = updates.phase2_prompt;
    }

    if (updates.initial_message) newForm.initial_message = updates.initial_message;
    if (updates.landing_title) newForm.landing_title = updates.landing_title;
    if (updates.landing_subtitle) newForm.landing_subtitle = updates.landing_subtitle;
    if (updates.landing_cta) newForm.landing_cta = updates.landing_cta;
    if (updates.primary_color) newForm.primary_color = updates.primary_color;
    if (updates.accent_color) newForm.accent_color = updates.accent_color;
    setForm(newForm);

    const updateData: any = {
      name: newForm.name,
      slug: newForm.slug,
      description: newForm.description,
      initial_message: newForm.initial_message,
      landing_title: newForm.landing_title,
      landing_subtitle: newForm.landing_subtitle,
      landing_cta: newForm.landing_cta,
      primary_color: newForm.primary_color,
      accent_color: newForm.accent_color,
    };
    if (isSinglePhaseProject) {
      updateData.prompt = newForm.prompt;
      updateData.phase1_prompt = newForm.prompt || "";
      updateData.phase2_prompt = newForm.phase2_prompt;
    } else {
      updateData.phase1_prompt = newForm.phase1_prompt;
      updateData.phase2_prompt = newForm.phase2_prompt;
    }

    const { error } = await supabase.from("projects").update(updateData).eq("id", project.id);
    if (error) {
      toast.error("Error al guardar cambios");
    } else {
      toast.success("✅ Cambios aplicados y guardados");
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const newApiMessages = [...apiMessages, { role: "user", content: text.trim() }];

    setMessages(prev => [...prev, userMsg]);
    setApiMessages(newApiMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";
    let toolCallArgs = "";
    let toolCallName = "";
    let hasToolCall = false;

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/edit-project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newApiMessages, currentProject: form }),
      });

      if (!res.ok) throw new Error("Error del servicio");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            const choice = parsed.choices?.[0];

            // Handle text content
            const delta = choice?.delta?.content;
            if (delta) {
              assistantContent += delta;
              const display = cleanDisplay(assistantContent);
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > 1) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: display } : m);
                }
                return [...prev, { role: "assistant", content: display }];
              });
              scrollToBottom();
            }

            // Handle tool calls
            const toolCalls = choice?.delta?.tool_calls;
            if (toolCalls) {
              for (const tc of toolCalls) {
                if (tc.function?.name) toolCallName = tc.function.name;
                if (tc.function?.arguments) toolCallArgs += tc.function.arguments;
                hasToolCall = true;
              }
            }
          } catch {}
        }
      }

      // Process tool call if we got one
      if (hasToolCall && toolCallName === "update_project" && toolCallArgs) {
        try {
          const updates = JSON.parse(toolCallArgs);
          await applyUpdates(updates);
        } catch (e) {
          console.error("Error parsing tool call:", e);
          toast.error("Error al procesar los cambios");
        }
      }

      // Fallback: also check for raw JSON action in text (backward compat)
      if (!hasToolCall) {
        const actionMatch = assistantContent.match(/\{"action"\s*:\s*"update_project"[\s\S]*$/);
        if (actionMatch) {
          try {
            const actionJson = JSON.parse(actionMatch[0]);
            if (actionJson.action === "update_project" && actionJson.data) {
              await applyUpdates(actionJson.data);
            }
          } catch (e) {
            console.error("Error parsing action JSON:", e);
          }
        }
      }

      const finalDisplay = cleanDisplay(assistantContent);
      setMessages(prev => {
        const withoutStreaming = prev.filter((_, i) => !(i === prev.length - 1 && prev[i].role === "assistant"));
        return [...withoutStreaming, { role: "assistant", content: finalDisplay }];
      });
      setApiMessages(prev => [...prev, { role: "assistant", content: assistantContent }]);
    } catch (e) {
      console.error(e);
      toast.error("Error al conectar con el asistente");
    } finally {
      setIsLoading(false);
    }
  };

  const FIELDS: { key: keyof typeof form; label: string; long?: boolean }[] = [
    { key: "name", label: "Nombre" },
    { key: "slug", label: "Slug (URL)" },
    { key: "description", label: "Descripción" },
    { key: "initial_message", label: "Mensaje inicial", long: true },
    { key: "landing_title", label: "Título landing" },
    { key: "landing_subtitle", label: "Subtítulo landing" },
    { key: "landing_cta", label: "CTA landing" },
    { key: "primary_color", label: "Color primario (hex)" },
    { key: "accent_color", label: "Color de acento (hex)" },
    ...(isSinglePhase
      ? [{ key: "prompt" as keyof typeof form, label: "Prompt (fase única)", long: true }]
      : [
          { key: "phase1_prompt" as keyof typeof form, label: "Prompt Fase 1", long: true },
          { key: "phase2_prompt" as keyof typeof form, label: "Prompt Fase 2", long: true },
        ]),
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-foreground">Editar proyecto</h2>
            <div className="flex items-center bg-secondary/50 rounded-lg p-0.5">
              <button
                onClick={() => setMode("manual")}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors ${mode === "manual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Manual
              </button>
              <button
                onClick={() => setMode("ai")}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-colors ${mode === "ai" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Sparkles size={12} /> Con IA
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {mode === "manual" ? (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {FIELDS.map(({ key, label, long }) => {
                const isExpanded = expandedFields[key] || !long;
                const value = (form[key] as string) || "";

                return (
                  <div key={key}>
                    <div
                      className={`flex items-center justify-between mb-1 ${long ? "cursor-pointer" : ""}`}
                      onClick={() => long && toggleField(key)}
                    >
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {label}
                      </label>
                      {long && (
                        isExpanded
                          ? <ChevronUp size={14} className="text-muted-foreground" />
                          : <ChevronDown size={14} className="text-muted-foreground" />
                      )}
                    </div>
                    {long && !isExpanded ? (
                      <p className="text-xs text-muted-foreground truncate">{value.substring(0, 80)}...</p>
                    ) : long ? (
                      <TextareaAutosize
                        value={value}
                        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                        minRows={4}
                        maxRows={15}
                        className="w-full resize-none bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 font-mono text-xs"
                      />
                    ) : key === "primary_color" || key === "accent_color" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={value || "#1488fc"}
                          onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-8 h-8 rounded border-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder="#1488fc"
                          className="flex-1 bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 font-mono"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full bg-secondary/50 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border p-4 flex justify-end">
              <button
                onClick={handleManualSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all disabled:opacity-40"
              >
                <Save size={14} /> {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-secondary text-foreground rounded-tl-none"}`}>
                    <div className="prose prose-sm prose-invert max-w-none prose-p:my-1">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-tl-none px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border p-3">
              <div className="relative rounded-xl bg-card ring-1 ring-border">
                <TextareaAutosize
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  placeholder="Describe los cambios que quieres hacer..."
                  maxRows={3}
                  className="w-full resize-none bg-transparent px-4 pt-3 pb-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[48px]"
                />
                <div className="absolute bottom-2 right-2">
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isLoading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-primary hover:brightness-110 text-primary-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <SendHorizontal size={14} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
