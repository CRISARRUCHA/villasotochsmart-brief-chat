import { useState, useRef, useCallback } from "react";
import { SendHorizontal, X, Sparkles, Mic, MicOff, ClipboardPaste } from "lucide-react";
import { useDictation } from "@/hooks/use-dictation";
import TextareaAutosize from "react-textarea-autosize";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CreateProjectChatProps {
  onProjectCreated: () => void;
  onClose: () => void;
}

export const CreateProjectChat = ({ onProjectCreated, onClose }: CreateProjectChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "👋 **¡Hola!** Vamos a crear un nuevo formulario IA personalizado.\n\nPuede ser para cualquier cosa: brief de sitio web, sondeo de prospectos, branding, onboarding, etc.\n\n**¿Cómo se llama el proyecto o cliente?**" },
  ]);
  const [apiMessages, setApiMessages] = useState<Array<{ role: string; content: string }>>([
    { role: "assistant", content: "¡Hola! Vamos a crear un nuevo formulario IA personalizado. ¿Cómo se llama el proyecto o cliente?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  const cleanDisplay = (text: string) =>
    text.replace(/\{"suggestions".*$/s, "").replace(/\{"action".*$/s, "").trim();

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
    let toolCallDetected = false;

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/create-project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newApiMessages }),
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
            
            if (choice?.delta?.tool_calls) {
              toolCallDetected = true;
              for (const tc of choice.delta.tool_calls) {
                if (tc.function?.arguments) {
                  toolCallArgs += tc.function.arguments;
                }
              }
              continue;
            }

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
          } catch {}
        }
      }

      if (toolCallDetected && toolCallArgs) {
        try {
          const projectData = JSON.parse(toolCallArgs);
          setMessages(prev => {
            const filtered = prev.filter((m, i) => !(i === prev.length - 1 && m.role === "assistant" && !m.content.trim()));
            return [...filtered, { role: "assistant", content: "✅ **¡Configuración generada!** Guardando proyecto..." }];
          });
          scrollToBottom();
          await saveProject(projectData);
        } catch (e) {
          console.error("Error parsing tool call args:", e, toolCallArgs.slice(0, 300));
          toast.error("Error al procesar la configuración del proyecto.");
        }
      }

      const finalDisplay = cleanDisplay(assistantContent);
      if (finalDisplay) {
        setMessages(prev => {
          const withoutStreaming = prev.filter((_, i) => !(i === prev.length - 1 && prev[i].role === "assistant"));
          return [...withoutStreaming, { role: "assistant", content: finalDisplay }];
        });
      }
      setApiMessages(prev => [...prev, { role: "assistant", content: assistantContent || "(tool call)" }]);
    } catch (e) {
      console.error(e);
      toast.error("Error al conectar con el asistente");
    } finally {
      setIsLoading(false);
    }
  };

  const saveProject = async (data: any) => {
    setSaving(true);
    try {
      const insertData: any = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        prompt: data.prompt,
        // Keep phase1/phase2 as empty defaults for backward compat
        phase1_prompt: data.prompt || "",
        phase2_prompt: "",
        initial_message: data.initial_message,
        primary_color: data.primary_color || "#1488fc",
        accent_color: data.accent_color || "#0f0f0f",
        landing_title: data.landing_title || data.name,
        landing_subtitle: data.landing_subtitle || null,
        landing_cta: data.landing_cta || "Comenzar",
        steps: data.steps || [],
        tips: data.tips || [],
      };

      const { error } = await supabase.from("projects").insert(insertData);

      if (error) {
        if (error.code === "23505") {
          toast.error("Ya existe un proyecto con ese slug");
        } else {
          toast.error("Error al guardar el proyecto");
          console.error(error);
        }
        return;
      }

      toast.success(`¡Proyecto "${data.name}" creado exitosamente!`);
      onProjectCreated();
    } catch (e) {
      console.error(e);
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Crear nuevo formulario IA</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

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
          {saving && (
            <div className="text-center text-sm text-muted-foreground py-2">Guardando proyecto...</div>
          )}
        </div>

        <div className="border-t border-border p-3">
          <div className="relative rounded-xl bg-card ring-1 ring-border">
            <TextareaAutosize
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Describe tu proyecto..."
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
      </div>
    </div>
  );
};
