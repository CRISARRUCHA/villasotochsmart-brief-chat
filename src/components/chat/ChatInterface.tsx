import { useState, useRef, useEffect, useCallback } from "react";
import { Send } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { SuggestionChips } from "./SuggestionChips";
import { BriefCard } from "./BriefCard";
import { streamChat, parseAIResponse, type Message, type Phase } from "@/lib/chat-stream";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  briefData?: Record<string, any>;
  briefType?: "preliminary" | "full";
}

const INITIAL_MESSAGE: DisplayMessage = {
  role: "assistant",
  content: "¡Hola! Soy tu consultor de proyecto web. Vamos a diseñar juntos la estrategia perfecta para tu sitio.\n\nPara empezar, **¿cuál es el nombre de tu negocio o proyecto?**",
  suggestions: ["Es un negocio nuevo, aún sin nombre", "Tengo el nombre pero no el logo", "Ya tengo marca registrada"],
};

// Topic counts for progress calculation
const PHASE1_TOPICS = 10;
const PHASE2_TOPICS = 11;

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
  const [currentSuggestions, setCurrentSuggestions] = useState<string[] | undefined>(INITIAL_MESSAGE.suggestions);
  const [briefId, setBriefId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(scrollToBottom, [messages, isLoading, scrollToBottom]);

  const estimateProgress = useCallback((msgCount: number, currentPhase: Phase) => {
    if (currentPhase === "done") return 100;
    const totalTopics = currentPhase === "brief" ? PHASE1_TOPICS : PHASE2_TOPICS;
    // Roughly 2 messages per topic (question + answer)
    const userMsgCount = Math.floor(msgCount / 2);
    const baseProgress = currentPhase === "full" ? 50 : 0;
    const phaseProgress = Math.min((userMsgCount / totalTopics) * (currentPhase === "brief" ? 50 : 50), currentPhase === "brief" ? 48 : 48);
    return Math.round(baseProgress + phaseProgress);
  }, []);

  const saveBrief = useCallback(async (data: Record<string, any>, fullData: Record<string, any> | null, phaseVal: string, chatHistory: Message[]) => {
    const clientName = data.nombre_negocio || null;
    if (briefId) {
      await supabase.from("briefs").update({
        client_name: clientName,
        brief_data: data,
        full_data: fullData,
        phase: phaseVal,
        chat_history: chatHistory as any,
        updated_at: new Date().toISOString(),
      }).eq("id", briefId);
    } else {
      const { data: inserted } = await supabase.from("briefs").insert({
        client_name: clientName,
        brief_data: data,
        full_data: fullData,
        phase: phaseVal,
        chat_history: chatHistory as any,
      }).select("id").single();
      if (inserted) setBriefId(inserted.id);
    }
  }, [briefId]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: DisplayMessage = { role: "user", content: text.trim() };
    const newApiMessages: Message[] = [...apiMessages, { role: "user", content: text.trim() }];

    setMessages(prev => [...prev, userMsg]);
    setApiMessages(newApiMessages);
    setInput("");
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
            // Show raw content while streaming (will parse after)
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
          }

          setMessages(prev => {
            // Replace the streaming message with final parsed version
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
      content: "¡Excelente! Ahora vamos con los detalles técnicos de tu proyecto.\n\n**¿Ya tienes un dominio registrado o servicio de hosting?** Si no, puedo orientarte sobre las mejores opciones para tu tipo de negocio.",
      suggestions: ["Ya tengo dominio y hosting", "Tengo dominio pero no hosting", "No tengo ninguno"],
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
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader phase={phase} progress={progress} />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
          {messages.map((m, i) => (
            <div key={i} className="space-y-3">
              {m.content && <MessageBubble role={m.role} content={m.content} />}
              {m.briefData && m.briefType === "preliminary" && (
                <BriefCard
                  title="Resumen de Proyecto"
                  data={m.briefData}
                  showContinue={phase !== "full" && phase !== "done"}
                  onContinue={handleContinueToPhase2}
                />
              )}
              {m.briefData && m.briefType === "full" && (
                <BriefCard title="Brief Técnico Completo" data={m.briefData} />
              )}
            </div>
          ))}

          {isLoading && <TypingIndicator />}

          {!isLoading && currentSuggestions && currentSuggestions.length > 0 && (
            <SuggestionChips suggestions={currentSuggestions} onSelect={sendMessage} />
          )}
        </div>
      </div>

      {/* Input */}
      {phase !== "done" && (
        <footer className="border-t border-border bg-background p-3 sm:p-4">
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <TextareaAutosize
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu respuesta..."
              maxRows={4}
              className="flex-1 resize-none bg-secondary border-none rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity hover:opacity-90"
            >
              <Send size={16} />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};
