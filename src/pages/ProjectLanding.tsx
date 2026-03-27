import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ParticleHero } from "@/components/ui/animated-hero";
import { StackedGlassCards, StepData } from "@/components/ui/glass-cards";
import { motion } from "framer-motion";
import { MessageSquare, Target, CheckCircle, ArrowRight, Lightbulb } from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  MessageSquare: <MessageSquare className="size-6" />,
  Target: <Target className="size-6" />,
  CheckCircle: <CheckCircle className="size-6" />,
};

interface Project {
  name: string;
  slug: string;
  landing_title: string | null;
  landing_subtitle: string | null;
  landing_cta: string | null;
  steps: any[] | null;
  tips: string[] | null;
}

const ProjectLanding = () => {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  // Support legacy routes like /villas-otoch by extracting slug from path
  const location = window.location.pathname;
  const slug = paramSlug || location.replace(/^\//, "").replace(/\/.*$/, "");
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("projects")
        .select("name, slug, landing_title, landing_subtitle, landing_cta, steps, tips")
        .eq("slug", slug)
        .single();
      if (data) setProject(data as Project);
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Cargando...</div>;
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Proyecto no encontrado</p>
        <button onClick={() => navigate("/")} className="text-primary underline text-sm">Volver al inicio</button>
      </div>
    );
  }

  const steps: StepData[] = (project.steps || []).map((s: any) => ({
    icon: ICON_MAP[s.icon] || <MessageSquare className="size-6" />,
    title: s.title,
    desc: s.desc,
    color: "rgba(20, 136, 252, 0.8)",
  }));

  const tips: string[] = project.tips || [];

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
              <img src="/lovable-uploads/icono-blanco.png" alt="Im-Pulsa Web" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
              {project.landing_title || project.name}
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-md">
              {project.landing_subtitle || "Cuéntanos sobre tu proyecto para crear algo extraordinario."}
            </p>
          </motion.div>

          {steps.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col items-center gap-2 text-muted-foreground text-sm"
            >
              <span>Descubre cómo funciona</span>
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-primary text-xl">↓</motion.div>
            </motion.div>
          )}
        </div>
      </ParticleHero>

      {steps.length > 0 && <StackedGlassCards steps={steps} />}

      <section className="relative flex flex-col items-center gap-6 sm:gap-8 py-20 sm:py-28 px-4 max-w-2xl mx-auto">
        {tips.length > 0 && (
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
        )}

        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onClick={() => navigate(`/p/${project.slug}/chat`)}
          className="group flex items-center gap-2.5 px-6 py-3 sm:px-7 sm:py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm sm:text-base shadow-[0_0_24px_rgba(20,136,252,0.4)] hover:shadow-[0_0_32px_rgba(20,136,252,0.55)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
        >
          {project.landing_cta || "Comenzar"}
          <ArrowRight className="size-5 group-hover:translate-x-0.5 transition-transform" />
        </motion.button>
      </section>
    </div>
  );
};

export default ProjectLanding;
