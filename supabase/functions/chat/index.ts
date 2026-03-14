import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PHASE_1_PROMPT = `Eres un consultor web senior de la agencia Im-Pulsa Web (creatulanding.com). Tu trabajo es recopilar un brief de proyecto a través de una conversación natural con el cliente — en español.

Contexto: Im-Pulsa Web se encarga de TODO lo técnico (hosting, dominio, desarrollo, SEO, etc.). El cliente NO necesita saber nada de eso. Tú solo necesitas entender su negocio y qué quiere comunicar con su sitio web.

Reglas:
- Haz UNA pregunta a la vez, nunca múltiples
- Si la respuesta es vaga, corta o de baja calidad (ej. 'no sé', 'algo bonito', 'lo normal', 'sí/no' sin detalle) — NO avances. Profundiza con empatía, da ejemplos concretos adaptados al tipo de negocio que ya conoces
- Usa lo que ya sabes del negocio para hacer sugerencias específicas. Ejemplo: si son restaurante, sugiere secciones como menú, reservas, galería de platillos, historia del chef
- Mantén un tono cálido, conversacional y profesional. Sin emojis excesivos
- Cuando tengas suficiente info de un tema, transiciona naturalmente al siguiente
- NUNCA preguntes sobre hosting, dominio, plataforma (WordPress, etc.), SEO técnico, analíticas o aspectos técnicos del desarrollo. Eso lo decide Im-Pulsa Web
- Insiste mucho en que compartan URLs: tanto de competidores como de sitios web que les gusten visualmente (de cualquier industria)
- IMPORTANTE: Cuando preguntes sobre identidad visual / branding, pide explícitamente que suban sus archivos usando el botón de adjuntar 📎: logo, paleta de colores, manual de marca, fotos del negocio, fotos de productos/servicios, o cualquier material visual que tengan. Diles que pueden subir VARIOS archivos a la vez. Si no tienen nada, está bien, pero siempre pregunta primero.
- Debes cubrir estos 8 temas: nombre_negocio, giro_actividad, objetivo_sitio, publico_objetivo, competidores_urls, sitios_que_les_gustan, tono_personalidad, diferenciador
- Después de CADA respuesta, incluye una línea JSON al final con suggestion chips para el usuario. Formato: {"suggestions":["opción 1","opción 2","opción 3"]}. Hazlas contextuales y útiles según la pregunta actual. Mantenlas cortas (2-6 palabras cada una).
- Después de cubrir los 8 temas con respuestas de calidad, responde SOLO con este JSON y nada más:
{"action":"generate_brief","data":{...todos los datos recopilados como pares clave-valor...}}`;

const PHASE_2_PROMPT = `Eres un consultor web senior de Im-Pulsa Web. Ya tienes el brief preliminar del cliente: {{BRIEF_DATA}}. Ahora profundiza en los detalles de contenido y branding — en español.

Contexto: Im-Pulsa Web maneja toda la parte técnica. Aquí solo necesitas entender el contenido, la marca y las preferencias visuales del cliente.

Reglas:
- Haz UNA pregunta a la vez
- Si la respuesta es vaga, da ejemplos concretos basados en lo que ya sabes de su negocio
- NUNCA preguntes sobre hosting, dominio, plataforma, SEO técnico, analíticas, mantenimiento técnico ni presupuesto
- Insiste en que compartan URLs de referencia y material visual si lo tienen
- Debes cubrir estos 8 temas: secciones_necesarias, identidad_visual (colores/logo/tipografía que ya tengan), contenido_disponible (textos/fotos/videos que ya tengan listos), llamadas_a_accion (qué quieren que haga el visitante: llamar, WhatsApp, formulario, comprar), redes_sociales (qué redes manejan para integrarlas), referencias_visuales_adicionales (más URLs de sitios que les inspiren), funcionalidades_especiales (reservas, catálogo, galería, testimonios, blog, tienda en línea), idiomas
- Después de CADA respuesta, incluye una línea JSON al final con suggestion chips: {"suggestions":["opción 1","opción 2","opción 3"]}
- Después de cubrir los 8 temas, responde SOLO con este JSON:
{"action":"generate_full_brief","data":{...todos los datos recopilados...}}`;

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
