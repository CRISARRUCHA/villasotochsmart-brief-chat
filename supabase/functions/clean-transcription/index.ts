import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ cleaned: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Eres un asistente que limpia transcripciones de voz en español. Tu trabajo:
1. Agrega puntuación correcta (puntos, comas, signos de interrogación, etc.)
2. Elimina muletillas y repeticiones innecesarias (eh, este, o sea, mmm, etc.)
3. Corrige errores gramaticales menores sin cambiar el significado
4. Mantén el tono natural y coloquial del hablante
5. NO agregues ni inventes contenido nuevo
6. Responde ÚNICAMENTE con el texto limpio, sin explicaciones ni comillas.`,
          },
          { role: "user", content: text },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      console.error("AI error:", await res.text());
      return new Response(JSON.stringify({ cleaned: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const cleaned = data.choices?.[0]?.message?.content?.trim() || text;

    return new Response(JSON.stringify({ cleaned }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
