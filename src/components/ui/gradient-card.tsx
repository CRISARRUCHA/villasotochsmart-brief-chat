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
          className="pointer-events-none absolute inset-0 z-[5] rounded-2xl"
          style={{
            opacity: 0.04,
            background: `linear-gradient(${105 + rotation.y * 3}deg, rgba(255,255,255,0.2) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.08) 100%)`,
          }}
        />

        {/* Dark gradient background */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#161616] via-[#111111] to-[#0a0a0a] rounded-2xl" />

        {/* Noise texture */}
        <div
          className="pointer-events-none absolute inset-0 z-[2] opacity-[0.04] mix-blend-overlay rounded-2xl"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
          }}
        />

        {/* Smudge / fingerprint texture for realism */}
        <div
          className="pointer-events-none absolute inset-0 z-[2] opacity-[0.012] rounded-2xl"
          style={{
            background: `radial-gradient(ellipse at 30% 60%, rgba(255,255,255,0.3), transparent 50%), radial-gradient(ellipse at 70% 40%, rgba(255,255,255,0.2), transparent 50%)`,
          }}
        />

        {/* ===== AURORA GLOW — bottom half purple/blue/teal like the reference ===== */}
        {/* Main purple center glow */}
        <div
          className="pointer-events-none absolute z-[1] rounded-2xl transition-opacity duration-700"
          style={{
            width: "120%",
            height: "65%",
            bottom: "-15%",
            left: "-10%",
            background: `radial-gradient(ellipse at 50% 80%, ${glowColor}44 0%, ${glowColor}18 35%, transparent 70%)`,
            opacity: isHovered ? 1 : 0.6,
            filter: "blur(10px)",
          }}
        />

        {/* Secondary teal/blue glow offset left */}
        <div
          className="pointer-events-none absolute z-[1] rounded-2xl transition-opacity duration-700"
          style={{
            width: "60%",
            height: "50%",
            bottom: "-5%",
            left: "5%",
            background: `radial-gradient(ellipse at center, rgba(56, 189, 248, 0.18) 0%, transparent 70%)`,
            opacity: isHovered ? 0.9 : 0.4,
            filter: "blur(20px)",
          }}
        />

        {/* Tertiary magenta glow offset right */}
        <div
          className="pointer-events-none absolute z-[1] rounded-2xl transition-opacity duration-700"
          style={{
            width: "55%",
            height: "45%",
            bottom: "-5%",
            right: "5%",
            background: `radial-gradient(ellipse at center, rgba(168, 85, 247, 0.2) 0%, transparent 70%)`,
            opacity: isHovered ? 0.9 : 0.4,
            filter: "blur(20px)",
          }}
        />

        {/* Mouse-following glow */}
        <div
          className="pointer-events-none absolute z-[1] transition-opacity duration-500 rounded-2xl"
          style={{
            width: "80%",
            height: "80%",
            left: `${mousePos.x * 100}%`,
            top: `${mousePos.y * 100}%`,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${glowColor}18 0%, transparent 60%)`,
            opacity: isHovered ? 1 : 0,
          }}
        />

        {/* Bottom border glow line */}
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-[3] transition-all duration-500"
          style={{
            width: isHovered ? "80%" : "50%",
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${glowColor}88, rgba(168,85,247,0.5), ${glowColor}88, transparent)`,
            opacity: isHovered ? 1 : 0.5,
            boxShadow: isHovered
              ? `0 0 30px 8px ${glowColor}33, 0 0 60px 16px rgba(168,85,247,0.15)`
              : `0 0 10px 2px ${glowColor}15`,
          }}
        />

        {/* Outer bottom glow (spread under card) */}
        <div
          className="pointer-events-none absolute z-[0] transition-opacity duration-700"
          style={{
            width: "70%",
            height: "30px",
            bottom: "-12px",
            left: "15%",
            background: `radial-gradient(ellipse at center, ${glowColor}30 0%, rgba(168,85,247,0.12) 40%, transparent 80%)`,
            opacity: isHovered ? 1 : 0.3,
            filter: "blur(12px)",
          }}
        />

        {/* Border glow */}
        <div
          className="pointer-events-none absolute inset-0 z-[4] rounded-2xl transition-all duration-500"
          style={{
            border: `1px solid ${isHovered ? glowColor + "30" : "rgba(255,255,255,0.06)"}`,
          }}
        />

        {/* Content */}
        <div className="relative z-[10]">{children}</div>
      </motion.div>
    </div>
  );
};
