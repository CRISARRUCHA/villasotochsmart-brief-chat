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

// Extract a balanced JSON object starting at a given index
function extractBalancedJson(content: string, startIdx: number): string | null {
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = startIdx; i < content.length; i++) {
    const ch = content[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return content.slice(startIdx, i + 1);
    }
  }
  return null;
}

// Find a JSON object containing a specific key, tolerant to whitespace/code fences
function findJsonByKey(content: string, key: string): { raw: string; parsed: any } | null {
  // Locate "key" pattern, then walk backwards to the opening {
  const keyRegex = new RegExp(`"${key}"\\s*:`, "g");
  let match: RegExpExecArray | null;
  while ((match = keyRegex.exec(content)) !== null) {
    // Walk back to find the opening brace of the enclosing object
    let braceIdx = -1;
    let depth = 0;
    for (let i = match.index - 1; i >= 0; i--) {
      const ch = content[i];
      if (ch === "}") depth++;
      else if (ch === "{") {
        if (depth === 0) { braceIdx = i; break; }
        depth--;
      }
    }
    if (braceIdx === -1) continue;
    const raw = extractBalancedJson(content, braceIdx);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      return { raw, parsed };
    } catch { /* try next */ }
  }
  return null;
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

  // Strip code fences to make detection easier (but keep original for replacement)
  const actionFound = findJsonByKey(content, "action");
  if (actionFound && typeof actionFound.parsed?.action === "string" && /^generate_(full_)?brief$/.test(actionFound.parsed.action)) {
    action = actionFound.parsed;
    text = text.replace(actionFound.raw, "").trim();
  }

  const suggestionsFound = findJsonByKey(text, "suggestions");
  if (suggestionsFound && Array.isArray(suggestionsFound.parsed?.suggestions)) {
    suggestions = suggestionsFound.parsed.suggestions;
    text = text.replace(suggestionsFound.raw, "").trim();
  }

  // Clean leftover code fences
  text = text.replace(/```json\s*```/g, "").replace(/```\s*```/g, "").trim();

  return { text, action, suggestions };
}
