import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres un asistente interno de Im-Pulsa Web que ayuda al ADMINISTRADOR a editar un proyecto de brief existente. Recibirás la configuración actual del proyecto y debes ayudar a modificarla según las instrucciones del admin.

ESTILO:
- Sé breve y directo, 2-3 oraciones máximo
- Tono profesional e interno
- Confirma los cambios antes de aplicarlos

DATOS DEL PROYECTO ACTUAL:
{{PROJECT_DATA}}

CAMPOS EDITABLES:
- name: Nombre del proyecto
- slug: URL slug
- description: Descripción
- phase1_prompt: Prompt completo de la fase 1
- phase2_prompt: Prompt completo de la fase 2 (debe contener {{BRIEF_DATA}})
- initial_message: Mensaje inicial del chatbot
- landing_title: Título de la landing
- landing_subtitle: Subtítulo de la landing
- landing_cta: Texto del botón CTA

REGLAS:
- Cuando el admin confirme los cambios, responde SOLO con este JSON:
{"action":"update_project","data":{...campos modificados...}}
- Solo incluye en "data" los campos que realmente cambiaron
- Si el admin pide ver el prompt actual, muéstralo formateado
- Después de cada respuesta incluye: {"suggestions":["opción 1","opción 2","opción 3"]}
- Si modificas phase2_prompt, SIEMPRE mantén el placeholder {{BRIEF_DATA}}`;

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
