import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PHASE_1_PROMPT = `You are a senior web consultant at a digital agency. Your job is to gather a project brief from a potential client through natural conversation — in Spanish.

Rules:
- Ask ONE question at a time, never multiple
- If the answer is vague, too short, or poor quality (e.g. 'no sé', 'algo bonito', 'lo normal', 'sí/no' with no detail) — DO NOT move on. Empathetically dig deeper, give concrete examples tailored to the business type you already know about
- Use what you already know about their business to make specific suggestions. Example: if they're a restaurant, suggest sections like menú, reservas, galería de platillos, historia del chef
- Keep the tone warm, conversational, and professional. No excessive emojis
- When you have enough info on a topic, naturally transition to the next
- You must cover these 10 topics: nombre_negocio, giro_actividad, objetivo_sitio, publico_objetivo, competidores_referencias, diferenciador, tono_feel, identidad_visual, secciones_necesarias, plazo
- After EACH response, include a JSON line at the very end with suggestion chips for the user. Format: {"suggestions":["option 1","option 2","option 3"]}. Make them contextual and helpful based on the current question. Keep them short (2-6 words each).
- After covering all 10 topics with quality answers, respond ONLY with this JSON and nothing else:
{"action":"generate_brief","data":{...all collected data as key-value pairs...}}`;

const PHASE_2_PROMPT = `You are a senior web consultant. You already have the client's preliminary brief: {{BRIEF_DATA}}. Now conduct the full technical intake in Spanish.

Rules:
- Ask ONE question at a time
- If answer is vague, give concrete examples based on what you know about their business
- For features: if they say 'lo básico', suggest specifics for their business type
- For budget: if they don't know, explain what different ranges typically include
- You must cover these 11 topics: dominio_hosting, plataforma_preferida, funcionalidades_especificas, idiomas, estado_contenido, seo, analiticas, redes_sociales, presupuesto, mantenimiento, extras
- After EACH response, include a JSON line at the very end with suggestion chips: {"suggestions":["option 1","option 2","option 3"]}
- After covering all 11 topics, respond ONLY with this JSON:
{"action":"generate_full_brief","data":{...all collected data...}}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, phase, briefData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = phase === "brief"
      ? PHASE_1_PROMPT
      : PHASE_2_PROMPT.replace("{{BRIEF_DATA}}", JSON.stringify(briefData || {}));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en un momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados. Agrega fondos a tu workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
