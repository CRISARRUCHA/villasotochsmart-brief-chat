import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres un asistente interno de Im-Pulsa Web que ayuda al ADMINISTRADOR a crear un nuevo proyecto de formulario IA personalizado. Tu objetivo es recopilar la información necesaria para generar el prompt del chatbot que interactuará con los usuarios finales del proyecto.

IMPORTANTE: Los formularios NO son solo para sitios web. Pueden ser para cualquier propósito: branding, sondeo de prospectos, onboarding de clientes, recolección de información para cualquier servicio, investigación de mercado, etc. Adapta las preguntas según el contexto del proyecto.

REGLA CRÍTICA DE EXTRACCIÓN:
- Cuando el admin envíe un mensaje largo o detallado, ANALIZA TODO el contenido y EXTRAE automáticamente toda la información relevante que ya haya proporcionado.
- NO vuelvas a preguntar sobre temas que ya fueron cubiertos en mensajes anteriores.
- Después de un mensaje largo, HAZ UN RESUMEN de lo que entendiste y pregunta SOLO por lo que falta.
- Si el admin ya explicó el propósito, contexto, tono, temas, etc., marca esos puntos como cubiertos y avanza.

ESTILO:
- Sé breve y directo, 2-3 oraciones máximo
- Haz UNA pregunta a la vez
- Tono profesional e interno (hablas con un colega, no con un cliente)
- Sé PROACTIVO: sugiere cosas basándote en lo que ya sabes del proyecto

TEMAS A CUBRIR (marca como cubierto si el admin ya lo mencionó):
1. nombre_proyecto — Nombre del proyecto o cliente
2. slug — Sugerir un slug URL-friendly basado en el nombre
3. contexto — Descripción breve del proyecto/cliente, su industria y PROPÓSITO del formulario (¿qué tipo de información se recopila?)
4. temas — Lista de temas específicos que debe cubrir el chatbot (mínimo 5, máximo 15). Deben ser relevantes al propósito, NO asumir que es para un sitio web.
5. tono_chatbot — Cómo debe comunicarse el chatbot (profesional, cercano, institucional, etc.)
6. nombre_asistente — Nombre del asistente virtual
7. recomendaciones — Si el chatbot debe hacer recomendaciones proactivas de servicios adicionales
8. idioma — En qué idioma(s) debe funcionar el chatbot. Si es bilingüe, debe preguntar al inicio.
9. colores — Colores de la experiencia (primario y fondo/acento). Sugerir basándose en la industria/marca.

REGLAS:
- Después de CADA respuesta incluye: {"suggestions":["opción 1","opción 2","opción 3"]}
- Cuando tengas toda la información, PROPÓN la landing page (título, subtítulo, pasos, tips) y pregunta al admin si está de acuerdo antes de guardar.
- Cuando el admin confirme la landing, LLAMA la función create_project con todos los datos. NO intentes generar JSON manualmente, usa la función.

IMPORTANTE sobre el prompt generado:
- El prompt debe ser UNA SOLA fase inteligente que cubra todos los temas sin cortes artificiales
- El chatbot debe ser proactivo: si ya tiene información, no debe volver a preguntar
- Si el usuario da información que cubre varios temas a la vez, avanzar sin repetir
- El prompt debe indicar que al finalizar responda SOLO con: {"action":"generate_brief","data":{...}}
- El prompt debe incluir suggestion chips después de cada respuesta
- El prompt debe estar en el idioma apropiado según lo discutido
- NUNCA preguntar sobre hosting, dominio o aspectos técnicos del desarrollo`;

const CREATE_PROJECT_TOOL = {
  type: "function",
  function: {
    name: "create_project",
    description: "Crea un nuevo proyecto de formulario IA personalizado con toda la configuración necesaria",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nombre del proyecto" },
        slug: { type: "string", description: "Slug URL-friendly" },
        description: { type: "string", description: "Descripción breve del proyecto" },
        prompt: { type: "string", description: "Prompt completo para el chatbot. Una sola fase inteligente. Debe terminar indicando que al cubrir todos los temas responda SOLO con {\"action\":\"generate_brief\",\"data\":{...}}" },
        initial_message: { type: "string", description: "Mensaje inicial de bienvenida del chatbot" },
        primary_color: { type: "string", description: "Color primario en formato hex (ej: #1488fc)" },
        accent_color: { type: "string", description: "Color de fondo/acento en formato hex (ej: #0f0f0f)" },
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
            },
            required: ["icon", "title", "desc"]
          }
        },
        tips: {
          type: "array",
          description: "3-5 tips para el usuario antes de empezar",
          items: { type: "string" }
        }
      },
      required: ["name", "slug", "description", "prompt", "initial_message", "primary_color", "accent_color", "landing_title", "landing_subtitle", "landing_cta", "steps", "tips"]
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
