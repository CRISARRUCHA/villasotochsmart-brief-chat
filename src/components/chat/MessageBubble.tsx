import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";


interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export const MessageBubble = ({ role, content }: MessageBubbleProps) => {
  const isAssistant = role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`flex items-start gap-3 ${isAssistant ? "mr-8 sm:mr-12" : "ml-8 sm:ml-12 justify-end"}`}
    >
      {isAssistant && (
        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-1 ring-1 ring-primary/20 p-1">
          <img src="/lovable-uploads/55dcf272-8bf1-4591-968e-0d6aa8b77e0e.png" alt="iW" className="w-full h-full object-contain" />
        </div>
      )}
      <div
        className={
          isAssistant
            ? "bg-card text-foreground rounded-2xl rounded-tl-none px-4 py-3 shadow-message ring-1 ring-white/[0.06]"
            : "bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4 py-3 shadow-[0_0_16px_rgba(20,136,252,0.2)]"
        }
      >
        <div className="text-[15px] leading-relaxed prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:text-inherit prose-strong:text-inherit">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
};
