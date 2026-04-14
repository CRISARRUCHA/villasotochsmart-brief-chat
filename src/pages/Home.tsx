import { useNavigate } from "react-router-dom";
import { ParticleHero } from "@/components/ui/animated-hero";
import { StackedGlassCards, StepData } from "@/components/ui/glass-cards";
import { motion } from "framer-motion";
import { MessageSquare, Zap, CheckCircle, ArrowRight, Lightbulb } from "lucide-react";

const steps: StepData[] = [
  {
    icon: <MessageSquare className="size-6" />,
    title: "Responde preguntas simples",
    desc: "Nuestro asistente te guía paso a paso para conocer tu negocio y lo que necesitas.",
    color: "rgba(20, 136, 252, 0.8)",
  },
  {
    icon: <Zap className="size-6" />,
    title: "Generamos tu brief automáticamente",
    desc: "Con tus respuestas creamos un documento profesional listo para diseñar tu web.",
    color: "rgba(20, 136, 252, 0.8)",
  },
  {
    icon: <CheckCircle className="size-6" />,
    title: "Recibe tu sitio web",
    desc: "Nosotros nos encargamos de todo lo técnico — tú solo conversas.",
    color: "rgba(20, 136, 252, 0.8)",
  },
];

const tips = [
  "Sé honesto/a, no hay respuestas incorrectas.",
  "Ten a mano el nombre de tu negocio y qué servicio/producto ofreces.",
  "Si tienes logo o colores de marca, mejor — pero no es obligatorio.",
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <ParticleHero particleCount={10}>
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto text-center gap-5 sm:gap-8 justify-center min-h-screen px-[12px]">
          {/* Logo + Title */}
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
              Im-Pulsa
            </h1>
            <p className="text-xs sm:text-sm text-primary/80 font-medium tracking-wide uppercase">
              Agencia de Automatizaciones y Tecnología
            </p>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-md mt-2">
              Crea el brief perfecto para tu sitio web en minutos — solo
              conversando con nuestro asistente de IA.
            </p>
          </motion.div>

          {/* Scroll hint */}
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

      {/* Stacked Glass Cards Section */}
      <StackedGlassCards steps={steps} />

      {/* Tips + CTA Section */}
      <section className="relative flex flex-col items-center gap-6 sm:gap-8 py-20 sm:py-28 px-4 max-w-2xl mx-auto">
        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-start gap-1.5 sm:gap-2 bg-card/40 backdrop-blur-sm ring-1 ring-border rounded-xl px-4 py-3 sm:px-5 sm:py-4 w-full text-left"
        >
          <div className="flex items-center gap-2 text-primary text-xs sm:text-sm font-semibold mb-0.5">
            <Lightbulb className="size-4" />
            Recomendaciones antes de empezar
          </div>
          {tips.map((tip, i) => (
            <p key={i} className="text-[11px] sm:text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              {tip}
            </p>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onClick={() => navigate("/chat")}
          className="group flex items-center gap-2.5 px-6 py-3 sm:px-7 sm:py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm sm:text-base shadow-[0_0_24px_rgba(20,136,252,0.4)] hover:shadow-[0_0_32px_rgba(20,136,252,0.55)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
        >
          Comenzar mi brief
          <ArrowRight className="size-5 group-hover:translate-x-0.5 transition-transform" />
        </motion.button>
      </section>
    </div>
  );
};

export default Home;
