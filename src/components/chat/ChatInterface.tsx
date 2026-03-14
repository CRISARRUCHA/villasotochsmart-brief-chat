import { useState, useRef, useEffect, useCallback } from "react";
import { SendHorizontal } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { SuggestionChips } from "./SuggestionChips";
import { BriefCard } from "./BriefCard";
import { FileUploadButton, PendingFilesPreview, type UploadedFile } from "./FileUploadButton";
import { FileAttachments } from "./FileAttachments";
import { CompletionScreen } from "./CompletionScreen";
import { streamChat, parseAIResponse, type Message, type Phase } from "@/lib/chat-stream";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  briefData?: Record<string, any>;
  briefType?: "preliminary" | "full";
  files?: UploadedFile[];
}

const INITIAL_MESSAGE: DisplayMessage = {
  role: "assistant",
  content: "👋 **¡Hola! Soy el asistente de Im-Pulsa Web.**\n\nEstoy aquí para conocer tu negocio y entender qué necesitas para tu nuevo sitio web. Nosotros nos encargamos de toda la parte técnica — tú solo cuéntame sobre tu negocio y lo que te gustaría comunicar.\n\n**Es muy sencillo:** solo responde mis preguntas con la mayor honestidad posible. No hay respuestas incorrectas. 🚀\n\nEmpecemos — **¿cómo te llamas y cuál es el nombre de tu negocio o proyecto?**",
};

const PHASE1_TOPICS = 8;
const PHASE2_TOPICS = 8;

export const ChatInterface = () => {
  const [messages, setMessages] = useState<DisplayMessage[]>([INITIAL_MESSAGE]);
  const [apiMessages, setApiMessages] = useState<Message[]>([
    { role: "assistant", content: INITIAL_MESSAGE.content },
  ]);
  const [phase, setPhase] = useState<Phase>("brief");
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [briefData, setBriefData] = useState<Record<string, any>>({});
  const [currentSuggestions, setCurrentSuggestions] = useState<string[] | undefined>(undefined);
  const [briefId, setBriefId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(scrollToBottom, [messages, isLoading, scrollToBottom]);

  // Mobile keyboard fix: scroll input into view when focused
  useEffect(() => {
    const handleResize = () => {
      if (document.activeElement === inputRef.current) {
        setTimeout(() => {
          inputRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
        }, 100);
      }
    };
    
    const visualViewport = window.visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener("resize", handleResize);
      return () => visualViewport.removeEventListener("resize", handleResize);
    }
  }, []);

  const estimateProgress = useCallback((msgCount: number, currentPhase: Phase) => {
    if (currentPhase === "done") return 100;
    const totalTopics = currentPhase === "brief" ? PHASE1_TOPICS : PHASE2_TOPICS;
    const userMsgCount = Math.floor(msgCount / 2);
    const baseProgress = currentPhase === "full" ? 50 : 0;
    const phaseProgress = Math.min((userMsgCount / totalTopics) * 50, 48);
    return Math.round(baseProgress + phaseProgress);
  }, []);

  const saveBrief = useCallback(async (data: Record<string, any>, fullData: Record<string, any> | null, phaseVal: string, chatHistory: Message[]) => {
    try {
      const clientName = data.nombre_negocio || null;
      if (briefId) {
        const { error } = await supabase.from("briefs").update({
          client_name: clientName,
          brief_data: data,
          full_data: fullData,
          phase: phaseVal,
          chat_history: chatHistory as any,
          updated_at: new Date().toISOString(),
        }).eq("id", briefId);
        if (error) console.error("Error updating brief:", error);
      } else {
        // Generate ID client-side to avoid needing SELECT permission after INSERT
        const newId = crypto.randomUUID();
        const { error } = await supabase.from("briefs").insert({
          id: newId,
          client_name: clientName,
          brief_data: data,
          full_data: fullData,
          phase: phaseVal,
          chat_history: chatHistory as any,
        });
        if (error) {
          console.error("Error saving brief:", error);
          toast.error("Error al guardar el brief");
        } else {
          setBriefId(newId);
        }
      }
    } catch (err) {
      console.error("Error saving brief:", err);
    }
  }, [briefId]);

  const sendMessage = async (text: string) => {
    if ((!text.trim() && pendingFiles.length === 0) || isLoading) return;

    const attachedFiles = [...pendingFiles];
    const fileNote = attachedFiles.length
      ? `\n\n[El cliente adjuntó ${attachedFiles.length} archivo(s): ${attachedFiles.map(f => f.name).join(", ")}]`
      : "";

    const userMsg: DisplayMessage = { role: "user", content: text.trim(), files: attachedFiles.length ? attachedFiles : undefined };
    const newApiMessages: Message[] = [...apiMessages, { role: "user", content: (text.trim() || "Adjunté archivos.") + fileNote }];

    setMessages(prev => [...prev, userMsg]);
    setApiMessages(newApiMessages);
    setInput("");
    setPendingFiles([]);
    setCurrentSuggestions(undefined);
    setIsLoading(true);

    let assistantContent = "";

    try {
      await streamChat({
        messages: newApiMessages,
        phase,
        briefData: phase === "full" ? briefData : undefined,
        onDelta: (chunk) => {
          assistantContent += chunk;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            const displayContent = assistantContent.replace(/\{"suggestions".*$/s, "").replace(/\{"action".*$/s, "").trim();
            if (last?.role === "assistant" && prev.indexOf(last) === prev.length - 1 && !last.briefData) {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: displayContent } : m);
            }
            return [...prev, { role: "assistant", content: displayContent }];
          });
          scrollToBottom();
        },
        onDone: () => {
          const { text: cleanText, action, suggestions } = parseAIResponse(assistantContent);

          const finalMsg: DisplayMessage = { role: "assistant", content: cleanText, suggestions };

          if (action?.action === "generate_brief") {
            finalMsg.briefData = action.data;
            finalMsg.briefType = "preliminary";
            setBriefData(action.data);
            setProgress(50);
            const allMessages: Message[] = [...newApiMessages, { role: "assistant", content: assistantContent }];
            saveBrief(action.data, null, "brief", allMessages);
          } else if (action?.action === "generate_full_brief") {
            const merged = { ...briefData, ...action.data };
            finalMsg.briefData = merged;
            finalMsg.briefType = "full";
            setPhase("done");
            setProgress(100);
            const allMessages: Message[] = [...newApiMessages, { role: "assistant", content: assistantContent }];
            saveBrief(briefData, action.data, "done", allMessages);
          } else {
            setProgress(estimateProgress(newApiMessages.length + 1, phase));
            // Auto-save progress periodically
            const allMessages: Message[] = [...newApiMessages, { role: "assistant", content: assistantContent }];
            const currentData = phase === "brief" ? { ...briefData, _partial: true } : briefData;
            saveBrief(currentData, null, phase, allMessages);
          }

          setMessages(prev => {
            const withoutStreaming = prev.filter((m, i) => !(i === prev.length - 1 && m.role === "assistant" && !m.briefData));
            return [...withoutStreaming, finalMsg];
          });

          setApiMessages(prev => [...prev, { role: "assistant", content: assistantContent }]);
          setCurrentSuggestions(suggestions);
          setIsLoading(false);
        },
      });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Error al conectar con el asistente");
      setIsLoading(false);
    }
  };

  const handleContinueToPhase2 = () => {
    setPhase("full");
    setApiMessages([]);
    setCurrentSuggestions(undefined);
    const introMsg: DisplayMessage = {
      role: "assistant",
      content: "¡Excelente! Ahora vamos a profundizar en los detalles de contenido y diseño de tu sitio.\n\n**¿Qué secciones te gustaría que tuviera tu sitio web?** Por ejemplo: inicio, nosotros, servicios, galería, contacto, testimonios, blog...",
      suggestions: ["Las básicas: inicio, servicios y contacto", "Quiero una tienda en línea", "No estoy seguro, ayúdame a decidir"],
    };
    setMessages(prev => [...prev, introMsg]);
    setApiMessages([{ role: "assistant", content: introMsg.content }]);
    setCurrentSuggestions(introMsg.suggestions);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <ChatHeader phase={phase} progress={progress} />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5 pb-4">
          {messages.map((m, i) => (
            <div key={i} className="space-y-3">
              {m.content && <MessageBubble role={m.role} content={m.content} />}
              {m.files && m.files.length > 0 && (
                <div className={m.role === "user" ? "ml-8 sm:ml-12 flex justify-end" : "mr-8 sm:mr-12"}>
                  <FileAttachments files={m.files} />
                </div>
              )}
              {m.briefData && m.briefType === "preliminary" && (
                <BriefCard
                  title="Resumen de Proyecto"
                  data={m.briefData}
                  showContinue={phase !== "full" && phase !== "done"}
                  onContinue={handleContinueToPhase2}
                />
              )}
              {m.briefData && m.briefType === "full" && (
                <BriefCard title="Brief Completo" data={m.briefData} />
              )}
            </div>
          ))}

          {isLoading && <TypingIndicator />}

          {!isLoading && currentSuggestions && currentSuggestions.length > 0 && (
            <SuggestionChips suggestions={currentSuggestions} onSelect={sendMessage} />
          )}

          {phase === "done" && <CompletionScreen />}
        </div>
      </div>

      {/* Input */}
      {phase !== "done" && (
        <footer className="border-t border-border bg-background sticky bottom-0 z-10">
          <PendingFilesPreview
            files={pendingFiles}
            onRemove={(idx) => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
          />
          <div className="p-3 sm:p-4">
            <div className="max-w-3xl mx-auto">
              <div className="relative rounded-2xl bg-card ring-1 ring-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_2px_20px_rgba(0,0,0,0.4)]">
                <TextareaAutosize
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    setTimeout(() => {
                      inputRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
                    }, 300);
                  }}
                  placeholder="Escribe tu respuesta..."
                  maxRows={4}
                  className="w-full resize-none bg-transparent px-5 pt-4 pb-12 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[60px]"
                />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <FileUploadButton
                    briefId={briefId}
                    onFilesUploaded={(files) => setPendingFiles(prev => [...prev, ...files])}
                    pendingFiles={pendingFiles}
                    onRemoveFile={(idx) => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={(!input.trim() && pendingFiles.length === 0) || isLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary hover:brightness-110 text-primary-foreground transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-[0_0_20px_rgba(20,136,252,0.3)]"
                  >
                    <span className="hidden sm:inline">Enviar</span>
                    <SendHorizontal size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
