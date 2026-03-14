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
        className="text-sm px-3 py-1.5 rounded-full border border-border bg-background text-foreground hover:bg-secondary transition-colors duration-150"
      >
        {s}
      </button>
    ))}
  </motion.div>
);
