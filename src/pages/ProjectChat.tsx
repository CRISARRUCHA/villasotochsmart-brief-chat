import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatInterface } from "@/components/chat/ChatInterface";

interface ProjectConfig {
  initial_message: string;
  slug: string;
  prompt: string | null;
  primary_color: string | null;
  accent_color: string | null;
  show_suggestions: boolean;
}

const ProjectChat = () => {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const location = window.location.pathname;
  const slug = paramSlug || location.split("/").filter(Boolean)[0];
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("projects")
        .select("initial_message, slug, prompt, primary_color, accent_color")
        .eq("slug", slug)
        .single();
      if (data) {
        setConfig(data as ProjectConfig);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Cargando...</div>;
  }

  if (!config) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Proyecto no encontrado</div>;
  }

  // Determine if this project uses single-phase mode
  const isSinglePhase = !!config.prompt;

  return (
    <ChatInterface
      project={slug}
      initialMessageOverride={config.initial_message}
      singlePhase={isSinglePhase}
      primaryColor={config.primary_color || undefined}
      accentColor={config.accent_color || undefined}
    />
  );
};

export default ProjectChat;
