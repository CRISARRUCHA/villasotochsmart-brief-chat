import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion";
import impulsaLogo from "@/assets/impulsa-logo-white.png";

/* ============================================================
   PLAN DE IMPLEMENTACIÓN: VILLAS OTOCH PARAÍSO
   Landing Page Inmersiva — Dark Mode / Minimalista
   React + Tailwind CSS + Framer Motion
   ============================================================ */

const ACCENT = "#FF6B2C"; // naranja de acento (luces en movimiento)

/* ---------- Utilidades de animación ---------- */

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] },
  }),
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <motion.p
    variants={fadeUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.5 }}
    className="text-xs sm:text-sm tracking-[0.35em] uppercase text-neutral-500 mb-6"
  >
    {children}
  </motion.p>
);

/* ============================================================
   SECCIÓN 1 · HERO HEADER — EL DESPEGUE
   ============================================================ */

const HeroSection = ({ scrollY }: { scrollY: MotionValue<number> }) => {
  // Efecto de masking tipográfico: el título colosal se expande al hacer scroll
  const titleScale = useTransform(scrollY, [0, 700], [1, 8]);
  const titleOpacity = useTransform(scrollY, [0, 500, 700], [1, 0.6, 0]);
  const subOpacity = useTransform(scrollY, [0, 250], [1, 0]);

  return (
    <section className="relative h-[160vh]">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center bg-[#050505]">
        {/* ============================================================
            [PLACEHOLDER: VIDEO ABSTRACTO DE FONDO]
            Video con blur pesado — luces en movimiento rápido
            (naranjas y blancos). Reemplazar el div por:
            <video autoPlay muted loop playsInline src="/videos/hero-abstract.mp4" />
            ============================================================ */}
        <div className="absolute inset-0 blur-3xl opacity-40 pointer-events-none">
          <div
            className="absolute w-[60vw] h-[60vw] rounded-full animate-pulse"
            style={{
              background: `radial-gradient(circle, ${ACCENT}55, transparent 70%)`,
              top: "-10%",
              left: "-10%",
            }}
          />
          <div
            className="absolute w-[50vw] h-[50vw] rounded-full animate-pulse [animation-delay:1s]"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)",
              bottom: "-15%",
              right: "-5%",
            }}
          />
        </div>

        {/* Logotipo Im-Pulsa — esquina superior izquierda, discreto */}
        <img
          src={impulsaLogo}
          alt="Im-Pulsa"
          className="absolute top-6 left-6 h-7 sm:h-8 opacity-60 z-20"
        />

        {/* Título colosal con tipografía cinética */}
        <motion.div
          style={{ scale: titleScale, opacity: titleOpacity }}
          className="relative z-10 text-center px-6 origin-center"
        >
          <h1 className="text-white font-black leading-[0.95] tracking-tighter text-4xl sm:text-6xl lg:text-8xl max-w-6xl mx-auto">
            Plan de Implementación de los Canales de Comunicación.
          </h1>
        </motion.div>

        <motion.p
          style={{ opacity: subOpacity }}
          className="absolute bottom-16 left-0 right-0 text-center text-neutral-400 text-xs sm:text-sm tracking-[0.25em] uppercase z-10"
        >
          Resumen ejecutivo y siguientes pasos.
        </motion.p>

        {/* Indicador de scroll */}
        <motion.div
          style={{ opacity: subOpacity }}
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-neutral-600 text-xl z-10"
        >
          ↓
        </motion.div>
      </div>
    </section>
  );
};

/* ============================================================
   SECCIÓN 2 · EL ORIGEN Y LA UNIFICACIÓN (FASE 1)
   Fondo blanco inmaculado — prisma que responde al ratón
   ============================================================ */

const OrigenSection = () => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  return (
    <section
      className="relative bg-white text-neutral-900 py-32 sm:py-44 px-6"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setTilt({
          x: ((e.clientX - r.left) / r.width - 0.5) * 40,
          y: ((e.clientY - r.top) / r.height - 0.5) * 40,
        });
      }}
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* [PLACEHOLDER: ÍCONO ANIMADO DE PRISMA 3D — reemplazar por
            asset SVG/Lottie de prisma girando. Responde al ratón.] */}
        <motion.div
          animate={{ rotateX: tilt.y, rotateY: tilt.x }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          className="mx-auto mb-14 w-24 h-24 [transform-style:preserve-3d]"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon
              points="50,8 92,85 8,85"
              fill="none"
              stroke={ACCENT}
              strokeWidth="2.5"
            />
            <polygon
              points="50,26 78,78 22,78"
              fill="none"
              stroke="#111"
              strokeWidth="1.5"
              opacity="0.5"
            />
          </svg>
        </motion.div>

        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="text-4xl sm:text-6xl font-black tracking-tighter mb-10"
        >
          01. SÍNTESIS Y VALORES.
        </motion.h2>

        <motion.p
          variants={fadeUp}
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="text-base sm:text-lg text-neutral-500 max-w-2xl mx-auto border-l-2 pl-6 text-left"
          style={{ borderColor: ACCENT }}
        >
          #2 Reunión Sofía, James y Julio: Definición de los valores
          fundamentales del proyecto.
        </motion.p>
      </div>
    </section>
  );
};

/* ============================================================
   SECCIÓN 3 · OBJETIVOS Y HORIZONTE — BENTO BOX
   ============================================================ */

const bentoBlocks = [
  {
    title: "LO QUE HACEMOS",
    reveal:
      "Articular actores gubernamentales, privados y comunitarios para transformar una comunidad vulnerada.",
    span: "sm:col-span-1",
  },
  {
    title: "OBJETIVOS PÚBLICOS DEL PROYECTO",
    reveal: "Seguridad · Oportunidades · Replicabilidad.",
    span: "sm:col-span-2",
  },
  {
    title: "HORIZONTE",
    reveal:
      "Convertir a Villas Otoch Paraíso en el referente nacional de construcción de paz comunitaria: un modelo efectivo, replicable y sostenible que trascienda gobiernos y administraciones, basado en la articulación, la cultura y el protagonismo de su gente.",
    span: "sm:col-span-3",
    highlight: true,
  },
];

const BentoSection = () => (
  <section className="bg-[#0a0a0a] text-white py-32 sm:py-44 px-6">
    <div className="max-w-6xl mx-auto">
      <SectionLabel>Fase 1 — Continuación</SectionLabel>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {bentoBlocks.map((b, i) => (
          <motion.div
            key={b.title}
            variants={fadeUp}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className={`group relative rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 sm:p-10 min-h-[220px] overflow-hidden transition-colors duration-500 hover:border-neutral-600 ${b.span}`}
          >
            <h3
              className={`text-2xl sm:text-3xl font-black tracking-tight transition-all duration-500 ${
                b.highlight
                  ? "group-hover:[text-shadow:0_0_30px_rgba(255,107,44,0.9)] group-hover:text-[#FF6B2C]"
                  : ""
              }`}
            >
              {b.title}
            </h3>
            {/* Texto revelado al pasar el cursor */}
            <p className="mt-5 text-neutral-400 text-sm sm:text-base leading-relaxed opacity-0 translate-y-3 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
              {b.reveal}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Micro-copy inferior */}
      <motion.div
        variants={fadeUp}
        custom={2}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mt-10 grid sm:grid-cols-2 gap-6 text-xs sm:text-sm text-neutral-500 leading-relaxed"
      >
        <p>
          <span className="text-neutral-300 font-semibold">
            Fortalecer la identidad cultural y el turismo de barrio
          </span>{" "}
          — Visibilizando las historias, el arte y la creatividad como referente
          de transformación positiva.
        </p>
        <p>
          <span className="text-neutral-300 font-semibold">
            Generar datos y aprendizajes para políticas públicas
          </span>{" "}
          — Documentando el proceso para que otros territorios repliquen el
          modelo.
        </p>
      </motion.div>
    </div>
  </section>
);

/* ============================================================
   SECCIÓN 4 · EL PRESENTE (FASE 2) — LÍNEA DE TIEMPO VERTICAL
   ============================================================ */

const timelineItems = [
  {
    status: "done",
    text: "Planeación de Implementación de Plataformas de Comunicación (Sitio Web, Redes Sociales y Corporativas) COMPLETADO.",
  },
  {
    status: "done",
    text: "Aprobación del Plan por las administrativos correspondientes. COMPLETADO.",
  },
  {
    status: "current",
    text: "Presentación del plan al comité ejecutivo. (Paso actual).",
  },
];

const TimelineSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 40%"],
  });
  // La línea se "dibuja" con el scroll
  const lineScale = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });

  return (
    <section className="bg-[#050505] text-white py-32 sm:py-44 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-center mb-24"
        >
          ETAPA 2 ACTUAL:
        </motion.h2>

        <div ref={ref} className="relative pl-12 sm:pl-16">
          {/* Riel de fondo + línea animada */}
          <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-neutral-800" />
          <motion.div
            style={{ scaleY: lineScale }}
            className="absolute left-4 sm:left-6 top-0 bottom-0 w-px origin-top"
            // [ANIMACIÓN DE SCROLL: la línea se ilumina al avanzar]
            aria-hidden
          >
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(to bottom, #555, ${ACCENT})`,
              }}
            />
          </motion.div>

          <div className="space-y-20">
            {timelineItems.map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.6 }}
                className="relative"
              >
                {/* Nodo */}
                <span
                  className={`absolute -left-12 sm:-left-16 top-1 flex items-center justify-center w-8 h-8 rounded-full border text-sm font-bold ${
                    item.status === "current"
                      ? "border-transparent text-black animate-pulse"
                      : "border-neutral-700 text-neutral-500 bg-neutral-900"
                  }`}
                  style={
                    item.status === "current"
                      ? {
                          background: ACCENT,
                          boxShadow: `0 0 30px ${ACCENT}`,
                        }
                      : undefined
                  }
                >
                  {item.status === "done" ? "✓" : "→"}
                </span>
                <p
                  className={`text-lg sm:text-2xl font-semibold leading-snug ${
                    item.status === "current"
                      ? "text-white"
                      : "text-neutral-500"
                  }`}
                >
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ============================================================
   SECCIÓN 5 · LA VOZ DE LA COMUNIDAD (ETAPA 3) — PARALLAX
   ============================================================ */

const ComunidadSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {/* ============================================================
          [PLACEHOLDER: FOTOGRAFÍA B/N DE LA COMUNIDAD — EFECTO PARALLAX]
          Reemplazar el div por una imagen de alta calidad en blanco y
          negro con rostros de la comunidad:
          <motion.img style={{ y: bgY }} src="/images/comunidad-bn.jpg" />
          ============================================================ */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-[-20%] bg-neutral-900 grayscale flex items-center justify-center"
      >
        <span className="text-neutral-700 text-sm tracking-widest uppercase border border-dashed border-neutral-700 rounded-xl px-6 py-4">
          [ Placeholder — Fotografía B/N de la comunidad ]
        </span>
      </motion.div>
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 px-6 text-center max-w-5xl">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="text-white text-5xl sm:text-7xl lg:text-9xl font-black tracking-tighter leading-none"
        >
          ETAPA 3 PRÓXIMO PASO:
        </motion.h2>
        <motion.p
          variants={fadeUp}
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="mt-8 text-neutral-300 text-sm sm:text-base tracking-wide uppercase"
        >
          Evento de participación Dinámica de Comunidad para selección Nombre
          del Proyecto DEFINITIVO.
        </motion.p>
      </div>
    </section>
  );
};

/* ============================================================
   SECCIÓN 6 · ALMA VISUAL Y ESTRATEGIA (ETAPA 4)
   Elementos flotantes que se ensamblan magnéticamente
   ============================================================ */

const etapa4Items = [
  "Producción del Branding del proyecto",
  "Creación de Manual de Marca",
  "Justificación de Elección de Canales",
];

const FloatingItem = ({
  progress,
  offset,
  children,
}: {
  progress: MotionValue<number>;
  offset: { x: number; y: number; r: number };
  children: React.ReactNode;
}) => {
  const x = useTransform(progress, [0, 1], [offset.x, 0]);
  const y = useTransform(progress, [0, 1], [offset.y, 0]);
  const rotate = useTransform(progress, [0, 1], [offset.r, 0]);
  const opacity = useTransform(progress, [0, 0.4], [0, 1]);
  return (
    <motion.div
      style={{ x, y, rotate, opacity }}
      className="rounded-2xl border border-neutral-700 bg-neutral-900/80 backdrop-blur px-8 py-5 text-lg sm:text-2xl font-bold tracking-tight w-full sm:w-auto"
    >
      {children}
    </motion.div>
  );
};

const BrandingSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 90%", "start 30%"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 70, damping: 20 });
  // Cada elemento flota disperso y se ensambla al centro con el scroll
  const offsets = [
    { x: -220, y: -80, r: -8 },
    { x: 240, y: 40, r: 6 },
    { x: -120, y: 160, r: -4 },
  ];

  return (
    <section className="bg-[#0a0a0a] text-white py-32 sm:py-44 px-6 overflow-hidden">
      <div ref={ref} className="max-w-4xl mx-auto text-center">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="text-5xl sm:text-7xl font-black tracking-tighter mb-20"
        >
          ETAPA 4:
        </motion.h2>

        <div className="flex flex-col items-center gap-4">
          {etapa4Items.map((item, i) => (
            <FloatingItem key={item} progress={progress} offset={offsets[i]}>
              {item}
            </FloatingItem>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ============================================================
   SECCIÓN 7 · EL ECOSISTEMA FUNDACIONAL (ETAPA 5)
   Hologramas 3D + líneas de fibra óptica
   ============================================================ */

const EcosistemaSection = () => (
  <section className="relative bg-[#050505] text-white py-32 sm:py-44 px-6 overflow-hidden">
    {/* [PLACEHOLDER: LÍNEAS DE CONEXIÓN "FIBRA ÓPTICA" — reemplazar por
        animación SVG/Canvas de líneas dibujándose entre los nodos] */}
    <svg
      className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
      aria-hidden
    >
      <line x1="20%" y1="30%" x2="50%" y2="60%" stroke={ACCENT} strokeWidth="1" strokeDasharray="6 8" />
      <line x1="80%" y1="25%" x2="50%" y2="60%" stroke="#fff" strokeWidth="1" strokeDasharray="6 8" />
      <line x1="30%" y1="85%" x2="70%" y2="40%" stroke={ACCENT} strokeWidth="1" strokeDasharray="6 8" />
    </svg>

    <div className="relative max-w-5xl mx-auto text-center">
      <motion.h2
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        className="text-5xl sm:text-7xl font-black tracking-tighter mb-16"
      >
        ETAPA 5:
      </motion.h2>

      {/* [PLACEHOLDER: LOGOS SVG SURGIENDO EN 3D — Sitio Web / Google
          Maps / LinkedIn. Sustituir por SVGs oficiales (Freepik/brand
          assets) con animación de aparición holográfica.] */}
      <motion.p
        variants={fadeUp}
        custom={1}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        className="text-xl sm:text-3xl font-semibold leading-relaxed max-w-3xl mx-auto text-neutral-200"
      >
        Construcción del Sitio Web. Google Maps. LinkedIn: Apertura,
        Configuración y KIT Base. Día de lanzamiento del Sitio Web y LinkedIn.
      </motion.p>

      {/* Banners laterales pulsantes */}
      <div className="mt-16 flex flex-col sm:flex-row justify-center gap-6">
        {["SUMAR ACTORES Y ALIADOS", "ATRAER RECURSOS / FONDOS"].map(
          (b, i) => (
            <motion.div
              key={b}
              variants={fadeUp}
              custom={i + 2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              animate={{ opacity: [1, 0.65, 1] }}
              transition={{ repeat: Infinity, duration: 2.4, delay: i * 0.6 }}
              className="rounded-full border px-8 py-4 text-sm sm:text-base font-bold tracking-[0.2em]"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              {b}
            </motion.div>
          )
        )}
      </div>
    </div>
  </section>
);

/* ============================================================
   SECCIÓN 8 · CAMBIAR LA NARRATIVA (ETAPAS 6 Y 7)
   Tipografía dura — estigma tachado
   ============================================================ */

const NarrativaSection = () => (
  <section className="bg-black text-white py-32 sm:py-44 px-6 overflow-hidden">
    <div className="max-w-5xl mx-auto text-center">
      {/* [ANIMACIÓN TIPOGRÁFICA: el tachado se dibuja agresivamente al
          entrar en viewport] */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.4 }}
        className="relative inline-block"
      >
        <span className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tighter text-neutral-500">
          "zona peligrosa"
        </span>
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.35, delay: 0.5, ease: "easeIn" }}
          className="absolute left-0 right-0 top-1/2 h-[6px] sm:h-[10px] bg-red-600 origin-left -rotate-2"
        />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, delay: 1 }}
        className="mt-10 text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter"
        style={{ color: ACCENT, textShadow: `0 0 60px ${ACCENT}66` }}
      >
        "ejemplo de transformación"
      </motion.h2>

      {/* [PLACEHOLDER: LOGOS DE PLATAFORMAS ORBITANDO — Facebook,
          Instagram, TikTok, YouTube. Sustituir por SVGs con animación
          orbital alrededor del titular.] */}

      <motion.div
        variants={fadeUp}
        custom={2}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mt-16 grid sm:grid-cols-2 gap-6 text-xs sm:text-sm text-neutral-400 tracking-wide uppercase"
      >
        <p className="border border-neutral-800 rounded-2xl p-6">
          ETAPA 6 Segundo BLOQUE: Creación de Redes META (Gestión y ADS
          Facebook e Instagram)
        </p>
        <p className="border border-neutral-800 rounded-2xl p-6">
          ETAPA 7 Tercer BLOQUE: Creación de Tiktok y ADS Youtube (Gestión,
          Google ADS)
        </p>
      </motion.div>
    </div>
  </section>
);

/* ============================================================
   SECCIÓN 9 · LA MÁQUINA EN MOVIMIENTO (ETAPA 8 — CIERRE)
   Infinite marquee de fondo
   ============================================================ */

const marqueeItems =
  "Parrillas — Material Audiovisual — Blog — Optimización ADS Multiplataforma — ";

const CierreSection = () => (
  <section className="relative bg-neutral-100 text-neutral-900 py-40 sm:py-56 px-6 overflow-hidden">
    {/* Infinite marquee de fondo (derecha a izquierda) */}
    <div className="absolute inset-0 flex items-center pointer-events-none select-none" aria-hidden>
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
        className="whitespace-nowrap text-6xl sm:text-8xl font-black tracking-tighter text-neutral-200"
      >
        {marqueeItems.repeat(4)}
        {marqueeItems.repeat(4)}
      </motion.div>
    </div>

    <div className="relative z-10 max-w-3xl mx-auto text-center">
      <motion.h2
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        className="text-5xl sm:text-7xl font-black tracking-tighter"
      >
        ∞ ETAPA 8: Operación y Contenido.
      </motion.h2>
      <motion.p
        variants={fadeUp}
        custom={1}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mt-10 text-neutral-500 text-sm sm:text-base tracking-wide"
      >
        La maquinaria está encendida. La máquina no se detendrá.
      </motion.p>

      <motion.div
        variants={fadeUp}
        custom={2}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mt-16 flex justify-center"
      >
        <img src={impulsaLogo} alt="Im-Pulsa" className="h-8 invert opacity-50" />
      </motion.div>
    </div>
  </section>
);

/* ============================================================
   PÁGINA PRINCIPAL
   ============================================================ */

const PlanImplementacion = () => {
  const { scrollY } = useScroll();

  return (
    <main className="bg-[#050505] font-sans antialiased [&_*]:scroll-smooth">
      <HeroSection scrollY={scrollY} />
      <OrigenSection />
      <BentoSection />
      <TimelineSection />
      <ComunidadSection />
      <BrandingSection />
      <EcosistemaSection />
      <NarrativaSection />
      <CierreSection />
    </main>
  );
};

export default PlanImplementacion;
