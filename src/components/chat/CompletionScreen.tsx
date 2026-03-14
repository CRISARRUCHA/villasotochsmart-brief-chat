import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Rocket } from "lucide-react";
import logoHorizontal from "@/assets/logo-horizontal.png";

export const CompletionScreen = () => {
  useEffect(() => {
    // Fire confetti from both sides
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#1488fc", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#1488fc", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#1488fc", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6", "#fbbf24"],
    });

    frame();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col items-center justify-center text-center px-6 py-12 max-w-lg mx-auto"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mb-6 ring-2 ring-primary/20"
      >
        <PartyPopper size={36} className="text-primary" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl sm:text-3xl font-bold text-foreground mb-3"
      >
        ¡Brief completado! 🎉
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="text-muted-foreground text-[15px] leading-relaxed mb-8"
      >
        Ya tenemos toda la información que necesitamos para diseñar tu sitio web.
        Nuestro equipo se pondrá en contacto contigo muy pronto para los siguientes pasos.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-3 bg-card rounded-2xl px-5 py-4 ring-1 ring-white/[0.06] shadow-[var(--shadow-card)]"
      >
        <Rocket size={20} className="text-primary shrink-0" />
        <p className="text-sm text-foreground/80 text-left">
          <span className="font-semibold text-foreground">¿Qué sigue?</span> — Revisaremos tu brief, prepararemos una propuesta personalizada y te contactaremos para alinear detalles.
        </p>
      </motion.div>

      <motion.a
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        href="https://creatulanding.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 text-sm text-primary hover:underline"
      >
        Visita creatulanding.com →
      </motion.a>
    </motion.div>
  );
};
