import { motion } from "framer-motion";

export const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-start gap-3 mr-12"
  >
    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
      <span className="text-[10px] font-medium text-muted-foreground">IA</span>
    </div>
    <div className="bg-secondary rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-dot-pulse-1" />
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-dot-pulse-2" />
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-dot-pulse-3" />
    </div>
  </motion.div>
);
