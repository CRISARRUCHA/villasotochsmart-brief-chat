import { useState, useRef, useEffect, useCallback } from "react";
import { SendHorizontal, Mic, MicOff, ClipboardPaste } from "lucide-react";
import { useDictation } from "@/hooks/use-dictation";
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

const INITIAL_MESSAGES: Record<string, DisplayMessage> = {
  general: {
    role: "assistant",
    content: "👋 **¡Hola! Soy el asistente de Im-Pulsa Web.**\n\nEstoy aquí para conocer tu negocio y entender qué necesitas para tu nuevo sitio web. Nosotros nos encargamos de toda la parte técnica — tú solo cuéntame sobre tu negocio y lo que te gustaría comunicar.\n\n**Es muy sencillo:** solo responde mis preguntas con la mayor honestidad posible. No hay respuestas incorrectas. 🚀\n\nEmpecemos — **¿cómo te llamas y cuál es el nombre de tu negocio o proyecto?**",
  },
};

const PHASE1_TOPICS = 8;
const PHASE2_TOPICS = 8;

export interface ChatInterfaceProps {
  project?: string;
  initialMessageOverride?: string;
  singlePhase?: boolean;
  primaryColor?: string;
  accentColor?: string;
  showSuggestions?: boolean;
  completionTitle?: string;
  completionSubtitle?: string;
  completionNextLabel?: string;
  completionNextText?: string;
  completionLinkUrl?: string;
  completionLinkText?: string;
}

export const ChatInterface = ({ project = "general", initialMessageOverride, singlePhase = false, primaryColor, accentColor, showSuggestions = true, completionTitle, completionSubtitle, completionNextLabel, completionNextText, completionLinkUrl, completionLinkText }: ChatInterfaceProps) => {
  const storageKey = `chat-session-${project}`;

  const getInitialState = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.messages?.length > 1 || parsed.phase !== "brief") {
          return parsed;
        }
      }
    } catch {}
    return null;
  };

  const savedState = useRef(getInitialState()).current;

  const baseMessage = initialMessageOverride
    ? { role: "assistant" as const, content: initialMessageOverride }
    : (INITIAL_MESSAGES[project] || INITIAL_MESSAGES.general);
  const [messages, setMessages] = useState<DisplayMessage[]>(savedState?.messages || [baseMessage]);
  const [apiMessages, setApiMessages] = useState<Message[]>(savedState?.apiMessages || [
    { role: "assistant", content: baseMessage.content },
  ]);
  const [phase, setPhase] = useState<Phase>(savedState?.phase || "brief");
  const [progress, setProgress] = useState(savedState?.progress || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [briefData, setBriefData] = useState<Record<string, any>>(savedState?.briefData || {});
  const [currentSuggestions, setCurrentSuggestions] = useState<string[] | undefined>(savedState?.currentSuggestions);
  const [briefId, setBriefId] = useState<string | null>(savedState?.briefId || null);
  const briefIdRef = useRef<string | null>(savedState?.briefId || null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const fullChatHistoryRef = useRef<Message[]>(savedState?.fullChatHistory || [
    { role: "assistant", content: baseMessage.content },
  ]);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);

  // Persist chat state to localStorage
  useEffect(() => {
    const state = {
      messages,
      apiMessages,
      phase,
      progress,
      briefData,
      currentSuggestions,
      briefId: briefIdRef.current,
      fullChatHistory: fullChatHistoryRef.current,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {}
  }, [messages, apiMessages, phase, progress, briefData, currentSuggestions, storageKey]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const dictation = useDictation({
    onResult: (transcript) => setInput(transcript),
    onProcessed: (cleaned) => setInput(cleaned),
  });

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInput(prev => prev + text);
    } catch {
      // silently fail
    }
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(scrollToBottom, [messages, isLoading, scrollToBottom]);

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
    if (singlePhase) {
      // Single phase: progress from 0 to 100
      const userMsgCount = Math.floor(msgCount / 2);
      return Math.min(Math.round((userMsgCount / 10) * 95), 95);
    }
    const totalTopics = currentPhase === "brief" ? PHASE1_TOPICS : PHASE2_TOPICS;
    const userMsgCount = Math.floor(msgCount / 2);
    const baseProgress = currentPhase === "full" ? 50 : 0;
    const phaseProgress = Math.min((userMsgCount / totalTopics) * 50, 48);
    return Math.round(baseProgress + phaseProgress);
  }, [singlePhase]);

  const extractNameFromChat = useCallback((chatHistory: Message[]): string | null => {
    const firstUserMsg = chatHistory.find(m => m.role === "user");
    if (!firstUserMsg) return null;
    return firstUserMsg.content.substring(0, 100).trim() || null;
  }, []);

  const saveBrief = useCallback((data: Record<string, any>, fullData: Record<string, any> | null, phaseVal: string, chatHistory: Message[]) => {
    const payload = { data, fullData, phaseVal, chatHistory };

    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        try {
          const clientName =
            payload.data.nombre_negocio ||
            payload.data.nombre_contacto ||
            payload.data.name ||
            payload.data.contact_name ||
            extractNameFromChat(payload.chatHistory);

          const idToUse = briefIdRef.current ?? crypto.randomUUID();
          
          if (briefIdRef.current) {
            const { error } = await supabase.from("briefs").update({
              client_name: clientName,
              brief_data: payload.data,
              full_data: payload.fullData,
              phase: payload.phaseVal,
              chat_history: payload.chatHistory as any,
              updated_at: new Date().toISOString(),
            }).eq("id", briefIdRef.current);
            if (error) {
              console.error("Error updating brief:", error);
              return;
            }
          } else {
            const { error } = await supabase.from("briefs").insert({
              id: idToUse,
              client_name: clientName,
              brief_data: payload.data,
              full_data: payload.fullData,
              phase: payload.phaseVal,
              chat_history: payload.chatHistory as any,
              project,
            } as any);
            if (error) {
              console.error("Error inserting brief:", error);
              toast.error("Error al guardar el brief");
              return;
            }
          }

          if (!briefIdRef.current) {
            briefIdRef.current = idToUse;
            setBriefId(idToUse);
          }
        } catch (err) {
          console.error("Error saving brief:", err);
        }
      });
  }, [extractNameFromChat, project]);

  const sendMessage = async (text: string) => {
    if ((!text.trim() && pendingFiles.length === 0) || isLoading) return;

    const attachedFiles = [...pendingFiles];
    const fileNote = attachedFiles.length
      ? `\n\n[El cliente adjuntó ${attachedFiles.length} archivo(s): ${attachedFiles.map(f => f.name).join(", ")}]`
      : "";

    const userMsg: DisplayMessage = { role: "user", content: text.trim(), files: attachedFiles.length ? attachedFiles : undefined };
    const newApiMessages: Message[] = [...apiMessages, { role: "user", content: (text.trim() || "Adjunté archivos.") + fileNote }];
    const userHistoryMsg: Message = { role: "user", content: (text.trim() || "Adjunté archivos.") + fileNote };
    fullChatHistoryRef.current = [...fullChatHistoryRef.current, userHistoryMsg];

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
        phase: singlePhase ? "brief" : phase,
        briefData: phase === "full" ? briefData : undefined,
        project,
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
          fullChatHistoryRef.current = [...fullChatHistoryRef.current, { role: "assistant", content: assistantContent }];

          const finalMsg: DisplayMessage = { role: "assistant", content: cleanText, suggestions };

          if (action?.action === "generate_brief") {
            if (singlePhase) {
              // Single phase: this IS the complete brief
              finalMsg.briefData = action.data;
              finalMsg.briefType = "full";
              setPhase("done");
              setProgress(100);
              saveBrief(action.data, action.data, "done", fullChatHistoryRef.current);
            } else {
              // Legacy two-phase: this is the preliminary brief
              finalMsg.briefData = action.data;
              finalMsg.briefType = "preliminary";
              setBriefData(action.data);
              setProgress(50);
              saveBrief(action.data, null, "brief", fullChatHistoryRef.current);
            }
          } else if (action?.action === "generate_full_brief") {
            const merged = { ...briefData, ...action.data };
            finalMsg.briefData = merged;
            finalMsg.briefType = "full";
            setPhase("done");
            setProgress(100);
            saveBrief(merged, action.data, "done", fullChatHistoryRef.current);
          } else {
            setProgress(estimateProgress(newApiMessages.length + 1, phase));
            const currentData = phase === "brief" ? { ...briefData, _partial: true } : briefData;
            saveBrief(currentData, null, phase, fullChatHistoryRef.current);
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
    if (singlePhase) return; // Should not happen in single phase
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
    fullChatHistoryRef.current = [...fullChatHistoryRef.current, { role: "assistant", content: introMsg.content }];
    setCurrentSuggestions(introMsg.suggestions);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Dynamic theming styles
  const buttonStyle = primaryColor ? {
    backgroundColor: primaryColor,
    boxShadow: `0 0 20px ${primaryColor}4D`,
  } : {};

  const headerPrimaryColor = primaryColor;

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <ChatHeader phase={phase} progress={progress} singlePhase={singlePhase} primaryColor={headerPrimaryColor} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5 pb-4">
          {messages.map((m, i) => (
            <div key={i} className="space-y-3">
              {m.content && <MessageBubble role={m.role} content={m.content} primaryColor={primaryColor} />}
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

          {showSuggestions && !isLoading && currentSuggestions && currentSuggestions.length > 0 && (
            <SuggestionChips suggestions={currentSuggestions} onSelect={sendMessage} />
          )}

          {phase === "done" && <CompletionScreen />}
        </div>
      </div>

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
                  placeholder={dictation.isProcessing ? "✨ Procesando transcripción..." : dictation.isListening ? "🎙️ Escuchando..." : "Escribe tu respuesta..."}
                  maxRows={4}
                  className="w-full resize-none bg-transparent px-5 pt-4 pb-12 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[60px]"
                />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <FileUploadButton
                      briefId={briefId}
                      onFilesUploaded={(files) => setPendingFiles(prev => [...prev, ...files])}
                      pendingFiles={pendingFiles}
                      onRemoveFile={(idx) => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
                    />
                    {dictation.isSupported && (
                      <button
                        onClick={dictation.toggle}
                        disabled={dictation.isProcessing}
                        className={`p-2 rounded-lg transition-colors ${dictation.isProcessing ? "text-primary bg-primary/10 animate-pulse" : dictation.isListening ? "text-red-500 bg-red-500/10 animate-pulse" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                        title={dictation.isProcessing ? "Procesando..." : dictation.isListening ? "Detener dictado" : "Dictar con micrófono"}
                      >
                        {dictation.isListening ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                    )}
                    <button
                      onClick={handlePaste}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      title="Pegar desde portapapeles"
                    >
                      <ClipboardPaste size={16} />
                    </button>
                  </div>
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={(!input.trim() && pendingFiles.length === 0) || isLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium hover:brightness-110 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${primaryColor ? "text-white" : "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(20,136,252,0.3)]"}`}
                    style={primaryColor ? buttonStyle : undefined}
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
