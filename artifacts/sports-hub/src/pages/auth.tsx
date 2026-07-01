import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    setError(null);
    setStatus("sending");
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
      },
    });
    if (otpError) {
      setStatus("idle");
      setError(otpError.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
      <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
        {status === "sent" ? (
          <CheckCircle2 className="w-8 h-8 text-primary" />
        ) : (
          <Zap className="w-8 h-8 text-primary" />
        )}
      </div>

      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground mb-1">
        Welcome to
      </div>
      <h1
        className="text-4xl font-black tracking-tight mb-2"
        style={{ fontFamily: "var(--app-font-score)" }}
      >
        SignalOS
      </h1>
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-8">
        Your Personal Signal Mirror
      </p>

      {status === "sent" ? (
        <div className="max-w-sm">
          <p className="text-sm text-foreground leading-relaxed mb-2" data-testid="text-magic-link-sent">
            Check your email for a magic link to sign in.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We'll never share your email or use it for ads.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-3 text-left">
          <div>
            <label
              htmlFor="auth-email"
              className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5"
            >
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              data-testid="input-email"
              className={`w-full bg-card border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                error ? "border-destructive ring-1 ring-destructive" : "border-border/50"
              }`}
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={status === "sending"}
            data-testid="button-send-magic-link"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-sm font-black uppercase tracking-widest bg-primary text-primary-foreground transition-all duration-150 active:scale-95 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "sending" ? "Sending…" : <>Send Magic Link <ArrowRight className="w-4 h-4" /></>}
          </button>

          <p className="text-xs text-muted-foreground/70 mt-4 text-center">
            We'll never share your email or use it for ads.
          </p>
        </form>
      )}
    </div>
  );
}
