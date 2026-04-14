import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logoWhite from "@/assets/logo-white.png";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] via-[#0a0a0a] to-[#060606] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Noise texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />
      {/* Aurora glow bottom */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[50%]" style={{ background: "radial-gradient(ellipse at 50% 100%, hsl(211 96% 54% / 0.15) 0%, transparent 70%)", filter: "blur(40px)" }} />
      <div className="pointer-events-none absolute bottom-0 left-[20%] w-[40%] h-[40%]" style={{ background: "radial-gradient(ellipse at center, rgba(56, 189, 248, 0.1) 0%, transparent 70%)", filter: "blur(30px)" }} />
      <div className="pointer-events-none absolute bottom-0 right-[20%] w-[35%] h-[35%]" style={{ background: "radial-gradient(ellipse at center, rgba(168, 85, 247, 0.1) 0%, transparent 70%)", filter: "blur(30px)" }} />

      <div className="w-full max-w-sm space-y-6 relative z-10">
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111]/80 backdrop-blur-xl p-8 space-y-6 shadow-[0_0_80px_-20px_hsl(211_96%_54%/0.15)]">
          <div className="text-center space-y-1">
            <img src={logoWhite} alt="Im-Pulsa" className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground">Im-Pulsa</h1>
            <p className="text-xs text-primary/70 font-medium tracking-wide uppercase mb-1">Agencia de Automatizaciones y Tecnología</p>
            <p className="text-sm text-muted-foreground">Panel de administración</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 shadow-[0_0_20px_hsl(211_96%_54%/0.3)]"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
          {/* Bottom glow line */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px]" style={{ background: "linear-gradient(90deg, transparent, hsl(211 96% 54% / 0.5), rgba(168,85,247,0.3), hsl(211 96% 54% / 0.5), transparent)" }} />
        </div>
      </div>
    </div>
  );
};

export default Login;
