import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

interface GradientCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export const GradientCard: React.FC<GradientCardProps> = ({
  children,
  className = "",
  glowColor = "hsl(var(--primary))",
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
    setRotation({
      x: -(y - 0.5) * 6,
      y: (x - 0.5) * 6,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div style={{ perspective: "1200px" }}>
      <motion.div
        ref={cardRef}
        className={`relative overflow-hidden rounded-2xl cursor-pointer ${className}`}
        animate={{
          rotateX: rotation.x,
          rotateY: rotation.y,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Glass reflection overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-[5] rounded-2xl opacity-[0.03]"
          style={{
            background: `linear-gradient(${105 + rotation.y * 3}deg, rgba(255,255,255,0.15) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)`,
          }}
        />

        {/* Dark gradient background */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#141414] via-[#0f0f0f] to-[#0a0a0a] rounded-2xl" />

        {/* Noise texture */}
        <div
          className="pointer-events-none absolute inset-0 z-[2] opacity-[0.035] mix-blend-overlay rounded-2xl"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
          }}
        />

        {/* Dynamic glow that follows mouse */}
        <div
          className="pointer-events-none absolute z-[1] transition-opacity duration-500 rounded-2xl"
          style={{
            width: "70%",
            height: "70%",
            left: `${mousePos.x * 100}%`,
            top: `${mousePos.y * 100}%`,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${glowColor}22 0%, transparent 70%)`,
            opacity: isHovered ? 1 : 0,
          }}
        />

        {/* Bottom glow accent */}
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-[3] transition-opacity duration-500"
          style={{
            width: "60%",
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${glowColor}66, transparent)`,
            opacity: isHovered ? 1 : 0.4,
            boxShadow: isHovered ? `0 0 20px 4px ${glowColor}33` : "none",
          }}
        />

        {/* Border glow */}
        <div
          className="pointer-events-none absolute inset-0 z-[4] rounded-2xl transition-opacity duration-500"
          style={{
            border: `1px solid ${isHovered ? glowColor + "33" : "rgba(255,255,255,0.06)"}`,
          }}
        />

        {/* Content */}
        <div className="relative z-[10]">{children}</div>
      </motion.div>
    </div>
  );
};
