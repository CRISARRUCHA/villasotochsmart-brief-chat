import { useNavigate } from "react-router-dom";
import { ParticleHero } from "@/components/ui/animated-hero";
import { StackedGlassCards, StepData } from "@/components/ui/glass-cards";
import { motion } from "framer-motion";
import { MessageSquare, Target, CheckCircle, ArrowRight, Lightbulb } from "lucide-react";

const steps: StepData[] = [
  {
    icon: <MessageSquare className="size-6" />,
    title: "Cuéntanos tu visión",
    desc: "Responde preguntas sobre los objetivos de tu dependencia para el proyecto Villas Otoch.",
    color: "rgba(20, 136, 252, 0.8)",
  },
  {
    icon: <Target className="size-6" />,
    title: "Define tus métricas de éxito",
    desc: "Identifica qué resultados esperas lograr y cómo medir el impacto del sitio web.",
    color: "rgba(20, 136, 252, 0.8)",
  },
  {
    icon: <CheckCircle className="size-6" />,
    title: "Recibe recomendaciones",
    desc: "Con base en tus objetivos, te sugerimos estrategias digitales adicionales para maximizar el alcance.",
    color: "rgba(20, 136, 252, 0.8)",
  },
];

const tips = [
  "Piensa en qué logros específicos del proyecto quieres destacar.",
  "Considera qué audiencia quieres alcanzar con el sitio web.",
  "Si tienes material visual (fotos, videos del proyecto), tenlo a la mano.",
  "No hay respuestas incorrectas — queremos conocer tu perspectiva.",
];

const VillasOtoch = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background">
      <ParticleHero particleCount={10}>
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto text-center gap-5 sm:gap-8 justify-center min-h-screen px-[12px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-2 sm:gap-3 mt-[10px]"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_24px_rgba(20,136,252,0.5)] p-2">
              <img
                src="/lovable-uploads/icono-blanco.png"
                alt="Im-Pulsa Web"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
              Proyecto Social{" "}
              <span className="bg-gradient-to-b from-[hsl(211,96%,68%)] to-primary bg-clip-text text-transparent">
                Villas Otoch
              </span>
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-md">
              Ayúdanos a definir los objetivos y la visión del sitio web del proyecto.
              Tu perspectiva es clave para crear algo que represente a todas las dependencias.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col items-center gap-2 text-muted-foreground text-sm"
          >
            <span>Descubre cómo funciona</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-primary text-xl"
            >
              ↓
            </motion.div>
          </motion.div>
        </div>
      </ParticleHero>

      <StackedGlassCards steps={steps} />

      <section className="relative flex flex-col items-center gap-6 sm:gap-8 py-20 sm:py-28 px-4 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-start gap-1.5 sm:gap-2 bg-card/40 backdrop-blur-sm ring-1 ring-border rounded-xl px-4 py-3 sm:px-5 sm:py-4 w-full text-left"
        >
          <div className="flex items-center gap-2 text-primary text-xs sm:text-sm font-semibold mb-0.5">
            <Lightbulb className="size-4" />
            Antes de empezar
          </div>
          {tips.map((tip, i) => (
            <p key={i} className="text-[11px] sm:text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              {tip}
            </p>
          ))}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onClick={() => navigate("/villas-otoch/chat")}
          className="group flex items-center gap-2.5 px-6 py-3 sm:px-7 sm:py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm sm:text-base shadow-[0_0_24px_rgba(20,136,252,0.4)] hover:shadow-[0_0_32px_rgba(20,136,252,0.55)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
        >
          Compartir mi visión
          <ArrowRight className="size-5 group-hover:translate-x-0.5 transition-transform" />
        </motion.button>
      </section>
    </div>
  );
};

export default VillasOtoch;
