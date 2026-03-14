import { motion } from "framer-motion";

export const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-start gap-3 mr-12"
  >
    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-1 ring-1 ring-primary/20">
      <span className="text-[10px] font-bold text-primary">iW</span>
    </div>
    <div className="bg-card rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 ring-1 ring-white/[0.06]">
      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-dot-pulse-1" />
      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-dot-pulse-2" />
      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-dot-pulse-3" />
    </div>
  </motion.div>
);
