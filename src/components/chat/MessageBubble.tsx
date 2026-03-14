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
      className={`flex items-start gap-3 ${isAssistant ? "mr-12" : "ml-12 justify-end"}`}
    >
      {isAssistant && (
        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
          <span className="text-[10px] font-medium text-muted-foreground">IA</span>
        </div>
      )}
      <div
        className={
          isAssistant
            ? "bg-secondary text-foreground rounded-2xl rounded-tl-none px-4 py-3 shadow-message"
            : "bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4 py-3 shadow-message"
        }
      >
        <div className="text-[15px] leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-headings:text-inherit">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
};
