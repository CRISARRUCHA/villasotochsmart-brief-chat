import { useState } from "react";
import { BoltStyleChat } from "@/components/ui/bolt-style-chat";
import { ChatInterface } from "@/components/chat/ChatInterface";

const Index = () => {
  const [started, setStarted] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | undefined>();

  const handleSend = (message: string) => {
    setInitialMessage(message);
    setStarted(true);
  };

  if (started) {
    return <ChatInterface initialMessage={initialMessage} />;
  }

  return (
    <BoltStyleChat
      title="¿Qué quieres"
      subtitle="Cuéntanos sobre tu proyecto y nuestro asistente IA creará el brief perfecto."
      announcementText="Im-Pulsa Web — Brief IA"
      placeholder="Describe tu proyecto web ideal..."
      onSend={handleSend}
    />
  );
};

export default Index;
