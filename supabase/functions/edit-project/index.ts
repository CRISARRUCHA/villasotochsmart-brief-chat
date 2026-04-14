import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres un asistente interno de Im-Pulsa (Agencia de Automatizaciones y Tecnología) que ayuda al ADMINISTRADOR a editar un proyecto de brief existente. Recibirás la configuración actual del proyecto y debes ayudar a modificarla según las instrucciones del admin.

ESTILO:
- Sé breve y directo, 2-3 oraciones máximo
- Tono profesional e interno
- Confirma los cambios antes de aplicarlos mostrando un resumen claro

DATOS DEL PROYECTO ACTUAL:
{{PROJECT_DATA}}

CAMPOS EDITABLES:
- name: Nombre del proyecto
- slug: URL slug
- description: Descripción
- prompt: Prompt principal (fase única inteligente). Este es el campo que controla TODO el comportamiento del chatbot: su personalidad, tono, formato de respuestas, qué preguntas hace, cómo formatea el output, etc.
- phase1_prompt: Prompt de fase 1 (legacy, solo si no usa fase única)
- phase2_prompt: Prompt de fase 2 (legacy, debe contener {{BRIEF_DATA}})
- initial_message: Mensaje inicial del chatbot (lo primero que ve el usuario)
- landing_title: Título de la landing page
- landing_subtitle: Subtítulo de la landing page
- landing_cta: Texto del botón CTA
- primary_color: Color primario hex
- accent_color: Color de acento hex

CAPACIDADES DE FORMATO EN PROMPTS:
- Puedes instruir al chatbot a usar markdown: **negritas**, *itálicas*, saltos de línea, listas
- Puedes controlar la longitud de las respuestas (ej: "máximo 2 oraciones por mensaje")
- Puedes especificar que las sugerencias o recomendaciones se muestren en itálica
- Puedes controlar el formato del output final (JSON structure)
- Puedes definir párrafos separados, estilos de texto, etc.

REGLAS:
- Cuando el admin confirme los cambios, LLAMA la función update_project con los campos modificados. NO generes JSON manualmente.
- Solo incluye en la llamada los campos que realmente cambiaron
- Si el proyecto usa campo "prompt" (fase única), modifica ese campo. Si usa phase1_prompt/phase2_prompt (legacy), modifica esos.
- Si el admin pide ver el prompt actual, muéstralo formateado
- Después de cada respuesta incluye: {"suggestions":["opción 1","opción 2","opción 3"]}
- Si modificas phase2_prompt, SIEMPRE mantén el placeholder {{BRIEF_DATA}}
- IMPORTANTE: Cuando el admin pida cambios de formato o estilo en las respuestas del chatbot, modifica las instrucciones DENTRO del prompt/phase1_prompt para que el chatbot sepa cómo formatear sus mensajes`;

const UPDATE_PROJECT_TOOL = {
  type: "function",
  function: {
    name: "update_project",
    description: "Aplica los cambios al proyecto. Solo incluye los campos que cambiaron.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nombre del proyecto" },
        slug: { type: "string", description: "URL slug" },
        description: { type: "string", description: "Descripción del proyecto" },
        prompt: { type: "string", description: "Prompt principal (fase única)" },
        phase1_prompt: { type: "string", description: "Prompt fase 1 (legacy)" },
        phase2_prompt: { type: "string", description: "Prompt fase 2 (legacy)" },
        initial_message: { type: "string", description: "Mensaje inicial del chatbot" },
        landing_title: { type: "string", description: "Título de la landing" },
        landing_subtitle: { type: "string", description: "Subtítulo de la landing" },
        landing_cta: { type: "string", description: "Texto del botón CTA" },
        primary_color: { type: "string", description: "Color primario hex" },
        accent_color: { type: "string", description: "Color de acento hex" },
      },
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, currentProject } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = SYSTEM_PROMPT.replace(
      "{{PROJECT_DATA}}",
      JSON.stringify(currentProject, null, 2)
    );

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        max_tokens: 8192,
        tools: [UPDATE_PROJECT_TOOL],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("edit-project error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
