import { motion } from "framer-motion";

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export const SuggestionChips = ({ suggestions, onSelect }: SuggestionChipsProps) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-wrap gap-2 ml-10"
  >
    {suggestions.map((s, i) => (
      <button
        key={i}
        onClick={() => onSelect(s)}
        className="text-sm px-3.5 py-1.5 rounded-full border border-white/10 bg-card text-muted-foreground hover:text-foreground hover:bg-accent hover:border-white/15 transition-all duration-200 active:scale-95"
      >
        {s}
      </button>
    ))}
  </motion.div>
);
