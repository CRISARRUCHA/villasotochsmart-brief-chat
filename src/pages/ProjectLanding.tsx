import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
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
  primary_color: string | null;
  accent_color: string | null;
}

const ProjectLanding = () => {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = window.location.pathname;
  const slug = paramSlug || location.replace(/^\//, "").replace(/\/.*$/, "");
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("projects")
        .select("name, slug, landing_title, landing_subtitle, landing_cta, steps, tips, primary_color, accent_color")
        .eq("slug", slug)
        .single();
      if (data) setProject(data as Project);
      setLoading(false);
    };
    load();
  }, [slug]);

  const primaryColor = project?.primary_color || "#1488fc";
  const accentColor = project?.accent_color || "#0f0f0f";

  // Generate CSS custom properties for theming
  const themeStyle = useMemo(() => {
    if (!project) return {};
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };
    return {
      "--project-primary": hexToHsl(primaryColor),
      "--project-accent": hexToHsl(accentColor),
    } as React.CSSProperties;
  }, [project, primaryColor, accentColor]);

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

  const colorRgba = primaryColor
    ? `rgba(${parseInt(primaryColor.slice(1, 3), 16)}, ${parseInt(primaryColor.slice(3, 5), 16)}, ${parseInt(primaryColor.slice(5, 7), 16)}, 0.8)`
    : "rgba(20, 136, 252, 0.8)";

  const steps: StepData[] = (project.steps || []).map((s: any) => ({
    icon: ICON_MAP[s.icon] || <MessageSquare className="size-6" />,
    title: s.title,
    desc: s.desc,
    color: colorRgba,
  }));

  const tips: string[] = project.tips || [];

  return (
    <div className="bg-background" style={themeStyle}>
      <ParticleHero particleCount={10}>
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto text-center gap-5 sm:gap-8 justify-center min-h-screen px-[12px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-2 sm:gap-3 mt-[10px]"
          >
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center p-2"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 0 24px ${colorRgba}`,
              }}
            >
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
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ color: primaryColor }} className="text-xl">↓</motion.div>
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
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold mb-0.5" style={{ color: primaryColor }}>
              <Lightbulb className="size-4" />
              Antes de empezar
            </div>
            {tips.map((tip, i) => (
              <p key={i} className="text-[11px] sm:text-xs text-muted-foreground flex items-start gap-2">
                <span style={{ color: primaryColor }} className="mt-0.5">•</span>
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
          className="group flex items-center gap-2.5 px-6 py-3 sm:px-7 sm:py-3.5 rounded-full text-white font-semibold text-sm sm:text-base hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
          style={{
            backgroundColor: primaryColor,
            boxShadow: `0 0 24px ${colorRgba.replace("0.8", "0.4")}`,
          }}
        >
          {project.landing_cta || "Comenzar"}
          <ArrowRight className="size-5 group-hover:translate-x-0.5 transition-transform" />
        </motion.button>
      </section>
    </div>
  );
};

export default ProjectLanding;
