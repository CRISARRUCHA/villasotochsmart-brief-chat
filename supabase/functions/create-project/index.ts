import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres un asistente interno de Im-Pulsa Web que ayuda al ADMINISTRADOR a crear un nuevo proyecto de brief personalizado. Tu objetivo es recopilar la información necesaria para generar los prompts del chatbot que interactuará con los stakeholders/clientes del proyecto.

ESTILO:
- Sé breve y directo, 2-3 oraciones máximo
- Haz UNA pregunta a la vez
- Tono profesional e interno (hablas con un colega, no con un cliente)

TEMAS A CUBRIR:
1. nombre_proyecto — Nombre del proyecto o cliente
2. slug — Sugerir un slug URL-friendly basado en el nombre (ej: "villas-otoch", "hotel-maya")
3. contexto — Descripción breve del proyecto/cliente y su industria
4. objetivo_brief — Qué información necesitamos recopilar de los stakeholders/clientes
5. temas_fase1 — Lista de temas específicos para la primera fase del brief (mínimo 7, máximo 10)
6. temas_fase2 — Lista de temas para la segunda fase (contenido, diseño, etc.) (mínimo 6, máximo 8)
7. tono_chatbot — Cómo debe comunicarse el chatbot (profesional, cercano, institucional, etc.)
8. recomendaciones — Si el chatbot debe hacer recomendaciones proactivas de servicios (Meta Ads, SEO, etc.)
9. mensaje_inicial — Cómo debe presentarse el chatbot al usuario (nombre del asistente, contexto breve)
10. landing_info — Título y subtítulo para la landing page del proyecto

REGLAS:
- Después de CADA respuesta incluye: {"suggestions":["opción 1","opción 2","opción 3"]}
- Cuando tengas toda la información necesaria, LLAMA la función create_project con todos los datos. NO intentes generar JSON manualmente, usa la función.

IMPORTANTE sobre los prompts generados:
- El phase1_prompt debe terminar indicando que después de cubrir todos los temas responda SOLO con: {"action":"generate_brief","data":{...}}
- El phase2_prompt debe terminar indicando que responda SOLO con: {"action":"generate_full_brief","data":{...}}
- Ambos prompts deben indicar incluir suggestion chips después de cada respuesta
- El phase2_prompt DEBE contener el placeholder {{BRIEF_DATA}} para recibir los datos de la fase 1
- Los prompts deben estar en el idioma apropiado según lo discutido
- Incluye las reglas de comunicación (breve, una pregunta a la vez, no preguntar sobre hosting/dominio/técnico)`;

const CREATE_PROJECT_TOOL = {
  type: "function",
  function: {
    name: "create_project",
    description: "Crea un nuevo proyecto de brief personalizado con toda la configuración necesaria",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nombre del proyecto" },
        slug: { type: "string", description: "Slug URL-friendly" },
        description: { type: "string", description: "Descripción breve del proyecto" },
        phase1_prompt: { type: "string", description: "Prompt completo para la fase 1 del brief" },
        phase2_prompt: { type: "string", description: "Prompt completo para la fase 2. DEBE contener {{BRIEF_DATA}} como placeholder" },
        initial_message: { type: "string", description: "Mensaje inicial de bienvenida del chatbot" },
        landing_title: { type: "string", description: "Título para la landing page" },
        landing_subtitle: { type: "string", description: "Subtítulo para la landing page" },
        landing_cta: { type: "string", description: "Texto del botón CTA" },
        steps: {
          type: "array",
          description: "3 pasos para mostrar en la landing",
          items: {
            type: "object",
            properties: {
              icon: { type: "string", enum: ["MessageSquare", "Target", "CheckCircle", "Lightbulb", "Users", "FileText"] },
              title: { type: "string" },
              desc: { type: "string" },
              color: { type: "string" }
            },
            required: ["icon", "title", "desc", "color"]
          }
        },
        tips: {
          type: "array",
          description: "4 tips para el usuario",
          items: { type: "string" }
        }
      },
      required: ["name", "slug", "description", "phase1_prompt", "phase2_prompt", "initial_message", "landing_title", "landing_subtitle", "landing_cta", "steps", "tips"]
    }
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
        max_tokens: 8192,
        tools: [CREATE_PROJECT_TOOL],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido, intenta de nuevo en un momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados." }), {
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
    console.error("create-project error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
