export type Message = { role: "user" | "assistant"; content: string };
export type Phase = "brief" | "full" | "done";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface StreamChatParams {
  messages: Message[];
  phase: Phase;
  briefData?: Record<string, any>;
  project?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
}

export async function streamChat({ messages, phase, briefData, project, onDelta, onDone }: StreamChatParams) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      messages,
      phase: phase === "full" ? "full" : "brief",
      briefData,
      project,
    }),
  });

  if (!resp.ok || !resp.body) {
    const errorData = await resp.json().catch(() => ({ error: "Error de conexión" }));
    throw new Error(errorData.error || `Error ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

// Parse action JSON from AI response
export function parseAIResponse(content: string): {
  text: string;
  action?: { action: string; data: Record<string, any> };
  suggestions?: string[];
} {
  let text = content;
  let action: { action: string; data: Record<string, any> } | undefined;
  let suggestions: string[] | undefined;

  // Check for action JSON (generate_brief or generate_full_brief)
  const actionMatch = content.match(/\{"action"\s*:\s*"generate_(full_)?brief".*\}/s);
  if (actionMatch) {
    try {
      action = JSON.parse(actionMatch[0]);
      text = content.replace(actionMatch[0], "").trim();
    } catch { /* ignore */ }
  }

  // Check for suggestions JSON
  const suggestionsMatch = content.match(/\{"suggestions"\s*:\s*\[.*?\]\}/s);
  if (suggestionsMatch) {
    try {
      const parsed = JSON.parse(suggestionsMatch[0]);
      suggestions = parsed.suggestions;
      text = text.replace(suggestionsMatch[0], "").trim();
    } catch { /* ignore */ }
  }

  return { text, action, suggestions };
}
