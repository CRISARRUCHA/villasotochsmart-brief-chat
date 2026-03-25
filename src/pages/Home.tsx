import { useNavigate } from "react-router-dom";
import { ParticleHero } from "@/components/ui/animated-hero";
import { motion } from "framer-motion";
import { MessageSquare, Zap, CheckCircle, ArrowRight, Lightbulb } from "lucide-react";

const steps = [
  {
    icon: <MessageSquare className="size-5" />,
    title: "Responde preguntas simples",
    desc: "Nuestro asistente te guía paso a paso para conocer tu negocio y lo que necesitas.",
  },
  {
    icon: <Zap className="size-5" />,
    title: "Generamos tu brief automáticamente",
    desc: "Con tus respuestas creamos un documento profesional listo para diseñar tu web.",
  },
  {
    icon: <CheckCircle className="size-5" />,
    title: "Recibe tu sitio web",
    desc: "Nosotros nos encargamos de todo lo técnico — tú solo conversas.",
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
    <ParticleHero particleCount={13}>
      <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-4 text-center gap-8">
        {/* Logo + Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_24px_rgba(20,136,252,0.5)] p-2.5">
            <img
              src="/lovable-uploads/icono-blanco.png"
              alt="Im-Pulsa Web"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
            Im-Pulsa{" "}
            <span className="bg-gradient-to-b from-[hsl(211,96%,68%)] to-primary bg-clip-text text-transparent">
              Web
            </span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md">
            Crea el brief perfecto para tu sitio web en minutos — solo
            conversando con nuestro asistente de IA.
          </p>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full"
        >
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 bg-card/60 backdrop-blur-sm ring-1 ring-border rounded-xl px-4 py-5"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                {step.icon}
              </div>
              <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-start gap-2 bg-card/40 backdrop-blur-sm ring-1 ring-border rounded-xl px-5 py-4 w-full text-left"
        >
          <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-1">
            <Lightbulb className="size-4" />
            Recomendaciones antes de empezar
          </div>
          {tips.map((tip, i) => (
            <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              {tip}
            </p>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          onClick={() => navigate("/chat")}
          className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base shadow-[0_0_24px_rgba(20,136,252,0.4)] hover:shadow-[0_0_32px_rgba(20,136,252,0.55)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
        >
          Comenzar mi brief
          <ArrowRight className="size-5 group-hover:translate-x-0.5 transition-transform" />
        </motion.button>
      </div>
    </ParticleHero>
  );
};

export default Home;
