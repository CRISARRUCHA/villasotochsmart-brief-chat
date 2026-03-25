import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface GlassCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
  totalCards: number;
  color: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ icon, title, description, index, totalCards, color }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const container = containerRef.current;
    if (!card || !container) return;

    const targetScale = 1 - (totalCards - index) * 0.05;

    gsap.set(card, {
      scale: 1,
      transformOrigin: "center top"
    });

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: "top center",
      end: "bottom center",
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const scale = gsap.utils.interpolate(1, targetScale, progress);
        gsap.set(card, {
          scale: Math.max(scale, targetScale),
          transformOrigin: "center top"
        });
      }
    });

    return () => {
      trigger.kill();
    };
  }, [index, totalCards]);

  return (
    <div
      ref={containerRef}
      style={{
        height: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'sticky',
        top: 0
      }}
    >
      <div
        ref={cardRef}
        style={{
          position: 'relative',
          width: '85%',
          maxWidth: '600px',
          height: '280px',
          borderRadius: '24px',
          isolation: 'isolate',
          top: `calc(-5vh + ${index * 25}px)`,
          transformOrigin: 'top'
        }}
      >
        {/* Electric Border */}
        <div
          style={{
            position: 'absolute',
            inset: '-3px',
            borderRadius: '27px',
            padding: '3px',
            background: `conic-gradient(
              from 0deg,
              transparent 0deg,
              ${color} 60deg,
              ${color.replace('0.8', '0.6')} 120deg,
              transparent 180deg,
              ${color.replace('0.8', '0.4')} 240deg,
              transparent 360deg
            )`,
            zIndex: -1
          }}
        />

        {/* Card body */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '32px 24px',
          borderRadius: '24px',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(25px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(255,255,255,0.1)',
          overflow: 'hidden'
        }}>
          {/* Glass reflection */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '60%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            pointerEvents: 'none', borderRadius: '24px 24px 0 0'
          }} />
          {/* Shine line */}
          <div style={{
            position: 'absolute', top: '10px', left: '10px', right: '10px', height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
            borderRadius: '1px', pointerEvents: 'none'
          }} />
          {/* Side reflection */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '2px', height: '100%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
            borderRadius: '24px 0 0 24px', pointerEvents: 'none'
          }} />
          {/* Frosted texture */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 1px, transparent 2px),
              radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08) 1px, transparent 2px),
              radial-gradient(circle at 40% 80%, rgba(255,255,255,0.06) 1px, transparent 2px)
            `,
            backgroundSize: '30px 30px, 25px 25px, 35px 35px',
            pointerEvents: 'none', borderRadius: '24px', opacity: 0.7
          }} />

          {/* Content */}
          <div className="relative w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shadow-[0_0_16px_rgba(20,136,252,0.4)]">
            {icon}
          </div>
          <h3 className="relative text-lg sm:text-xl font-bold text-foreground text-center">{title}</h3>
          <p className="relative text-sm text-muted-foreground text-center max-w-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

export interface StepData {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}

interface StackedGlassCardsProps {
  steps: StepData[];
}

export const StackedGlassCards: React.FC<StackedGlassCardsProps> = ({ steps }) => {
  return (
    <section className="w-full text-foreground">
      {steps.map((step, index) => (
        <GlassCard
          key={index}
          icon={step.icon}
          title={step.title}
          description={step.desc}
          index={index}
          totalCards={steps.length}
          color={step.color}
        />
      ))}
    </section>
  );
};
