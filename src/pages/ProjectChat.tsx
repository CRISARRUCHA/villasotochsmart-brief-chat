import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatInterface } from "@/components/chat/ChatInterface";

const ProjectChat = () => {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const location = window.location.pathname;
  const slug = paramSlug || location.split("/").filter(Boolean)[0];
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("projects")
        .select("initial_message, slug")
        .eq("slug", slug)
        .single();
      if (data) {
        setInitialMessage(data.initial_message);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Cargando...</div>;
  }

  if (!initialMessage) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Proyecto no encontrado</div>;
  }

  return <ChatInterface project={slug} initialMessageOverride={initialMessage} />;
};

export default ProjectChat;
