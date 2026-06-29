import { useState } from "react";
import { CheckCircle2, ArrowRight, Shield, Zap } from "lucide-react";

// ── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "finance",       label: "Finance",       emoji: "💰", subs: ["Investing", "Budgeting", "Crypto"] },
  { id: "health",        label: "Health",         emoji: "🏃", subs: ["Fitness", "Nutrition", "Mental Health"] },
  { id: "wellness",      label: "Wellness",       emoji: "🧘", subs: ["Meditation", "Sleep", "Mindfulness"] },
  { id: "career",        label: "Career",         emoji: "💼", subs: ["Job Search", "Networking", "Skills"] },
  { id: "family",        label: "Family",         emoji: "🏠", subs: ["Parenting", "Education", "Activities"] },
  { id: "entertainment", label: "Entertainment",  emoji: "🎬", subs: ["Movies & TV", "Music", "Gaming"] },
  { id: "sports",        label: "Sports",         emoji: "🏆", subs: ["Football", "Basketball", "Baseball"] },
  { id: "technology",    label: "Technology",     emoji: "🤖", subs: ["AI", "Gadgets", "Software"] },
  { id: "politics",      label: "Politics",       emoji: "🗳️", subs: ["National", "Local", "International"] },
  { id: "lifestyle",     label: "Lifestyle",      emoji: "✈️", subs: ["Travel", "Food", "Fashion"] },
] as const;

const AGE_RANGES = ["Under 18", "18–25", "26–35", "36–50", "50+"] as const;
const DEMOGRAPHICS = ["Student", "Professional", "Parent", "Other"] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

type CategoryId = typeof CATEGORIES[number]["id"];

interface InterestState {
  selected: string[];
  freeText: string;
}

interface FormState {
  name: string;
  email: string;
  ageRange: string;
  demographicType: string;
  interests: Record<CategoryId, InterestState>;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === step ? 20 : 6,
            height: 6,
            background: i <= step ? "hsl(var(--primary))" : "hsl(var(--border))",
            opacity: i < step ? 0.4 : 1,
          }}
        />
      ))}
    </div>
  );
}

// Screen 1 — Welcome
function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
      <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
        <Zap className="w-8 h-8 text-primary" />
      </div>

      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground mb-1">
        Welcome to
      </div>
      <h1 className="text-4xl font-black tracking-tight mb-2" style={{ fontFamily: "var(--app-font-score)" }}>
        SignalOS
      </h1>
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-8">
        Your Personal Signal Mirror
      </p>

      <div className="max-w-sm bg-card border border-border/50 rounded-2xl p-5 mb-10 text-left">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            SignalOS is your personal signal mirror. We show you what matters
            to <span className="text-foreground font-semibold">you</span>, not
            what advertisers want to see. Your preferences stay private with us.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-black uppercase tracking-widest bg-primary text-primary-foreground transition-all duration-150 active:scale-95 hover:opacity-90"
      >
        Get Started <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// Screen 2 — About You
function AboutYouScreen({
  form,
  onChange,
  onNext,
}: {
  form: FormState;
  onChange: (updates: Partial<FormState>) => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState({ name: false, email: false });

  function handleNext() {
    const nameErr = !form.name.trim();
    const emailErr = !form.email.trim() || !form.email.includes("@");
    setErrors({ name: nameErr, email: emailErr });
    if (!nameErr && !emailErr) onNext();
  }

  const inputClass = (hasErr: boolean) =>
    `w-full bg-card border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
      hasErr ? "border-destructive ring-1 ring-destructive" : "border-border/50"
    }`;

  return (
    <div className="min-h-[100dvh] px-6 pt-14 pb-10 flex flex-col max-w-md mx-auto w-full">
      <ProgressDots step={1} total={5} />

      <div className="mb-6">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Step 2 of 5</div>
        <h2 className="text-2xl font-black tracking-tight">Tell us about you</h2>
        <p className="text-sm text-muted-foreground mt-1">Name and email are required. Everything else is optional.</p>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {/* Name */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
            Your Name <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            placeholder="First name or nickname"
            value={form.name}
            onChange={(e) => { onChange({ name: e.target.value }); setErrors((p) => ({ ...p, name: false })); }}
            className={inputClass(errors.name)}
          />
          {errors.name && <p className="text-xs text-destructive mt-1">Name is required</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
            Email <span className="text-primary">*</span>
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => { onChange({ email: e.target.value }); setErrors((p) => ({ ...p, email: false })); }}
            className={inputClass(errors.email)}
          />
          {errors.email && <p className="text-xs text-destructive mt-1">A valid email is required</p>}
        </div>

        {/* Age Range */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
            Age Range
          </label>
          <select
            value={form.ageRange}
            onChange={(e) => onChange({ ageRange: e.target.value })}
            className="w-full bg-card border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="">Select your age range</option>
            {AGE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Demographic */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            What best describes you?
          </label>
          <div className="flex flex-wrap gap-2">
            {DEMOGRAPHICS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ demographicType: d === form.demographicType ? "" : d })}
                className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all duration-150"
                style={
                  form.demographicType === d
                    ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderColor: "transparent" }
                    : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                }
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleNext}
        className="mt-8 flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-sm font-black uppercase tracking-widest bg-primary text-primary-foreground transition-all duration-150 active:scale-95 hover:opacity-90"
      >
        Next <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// Screen 3 — Pick Interests
function InterestsScreen({
  form,
  onChange,
  onNext,
}: {
  form: FormState;
  onChange: (updates: Partial<FormState>) => void;
  onNext: () => void;
}) {
  function toggleSub(catId: CategoryId, sub: string) {
    const current = form.interests[catId] ?? { selected: [], freeText: "" };
    const selected = current.selected.includes(sub)
      ? current.selected.filter((s) => s !== sub)
      : [...current.selected, sub];
    onChange({ interests: { ...form.interests, [catId]: { ...current, selected } } });
  }

  function setFreeText(catId: CategoryId, freeText: string) {
    const current = form.interests[catId] ?? { selected: [], freeText: "" };
    onChange({ interests: { ...form.interests, [catId]: { ...current, freeText } } });
  }

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto w-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50 px-6 pt-10 pb-4">
        <ProgressDots step={2} total={5} />
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-0.5">Step 3 of 5</div>
        <h2 className="text-2xl font-black tracking-tight">Pick your interests</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Choose what you want your signal to include. Skip anything.</p>
      </div>

      {/* Scrollable category list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
        {CATEGORIES.map((cat) => {
          const state = form.interests[cat.id] ?? { selected: [], freeText: "" };
          const hasSelection = state.selected.length > 0 || state.freeText.trim();
          return (
            <div
              key={cat.id}
              className="rounded-2xl border p-4 transition-all duration-150"
              style={{
                background: hasSelection ? "hsl(var(--card))" : "transparent",
                borderColor: hasSelection ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border) / 0.5)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg leading-none">{cat.emoji}</span>
                <span className="text-sm font-black uppercase tracking-widest text-foreground">{cat.label}</span>
                {state.selected.length > 0 && (
                  <span className="ml-auto text-[10px] font-bold text-primary">
                    {state.selected.length} selected
                  </span>
                )}
              </div>

              {/* Sub-preference pills */}
              <div className="flex flex-wrap gap-2 mb-3">
                {cat.subs.map((sub) => {
                  const active = state.selected.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSub(cat.id, sub)}
                      className="px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-150 active:scale-95"
                      style={
                        active
                          ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderColor: "transparent" }
                          : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                      }
                    >
                      {active && "✓ "}{sub}
                    </button>
                  );
                })}
              </div>

              {/* Free-form text */}
              <input
                type="text"
                placeholder={`Anything specific about ${cat.label.toLowerCase()}?`}
                value={state.freeText}
                onChange={(e) => setFreeText(cat.id, e.target.value)}
                className="w-full bg-background/50 border border-border/40 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          );
        })}
      </div>

      {/* Sticky footer button */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border/50 px-6 py-4">
        <button
          type="button"
          onClick={onNext}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-sm font-black uppercase tracking-widest bg-primary text-primary-foreground transition-all duration-150 active:scale-95 hover:opacity-90"
        >
          Next <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-center text-[10px] text-muted-foreground mt-2">You can skip any category</p>
      </div>
    </div>
  );
}

// Screen 4 — Privacy Promise
function PrivacyScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="min-h-[100dvh] px-6 pt-14 pb-10 flex flex-col justify-center max-w-md mx-auto w-full">
      <ProgressDots step={3} total={5} />

      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
        <Shield className="w-7 h-7 text-primary" />
      </div>

      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Step 4 of 5</div>
      <h2 className="text-2xl font-black tracking-tight mb-2">Our Privacy Promise</h2>

      <p className="text-sm text-muted-foreground leading-relaxed mb-8">
        Everything you share stays private. We use your preferences to personalize your
        signal, not to sell you anything.
      </p>

      <div className="flex flex-col gap-3 mb-10">
        {[
          "Your data is never sold to advertisers",
          "Your interests stay on your device and our secure servers",
          "You can update or delete your preferences any time",
          "No tracking pixels or third-party analytics",
        ].map((point) => (
          <div key={point} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-sm text-foreground leading-snug">{point}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-sm font-black uppercase tracking-widest bg-primary text-primary-foreground transition-all duration-150 active:scale-95 hover:opacity-90"
      >
        I Understand <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// Screen 5 — Done
function DoneScreen({
  name,
  onFinish,
  submitting,
  error,
}: {
  name: string;
  onFinish: () => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <div className="min-h-[100dvh] px-6 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
      <ProgressDots step={4} total={5} />

      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 mb-6">
        <CheckCircle2 className="w-10 h-10 text-primary" />
      </div>

      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Step 5 of 5</div>
      <h2 className="text-3xl font-black tracking-tight mb-1" style={{ fontFamily: "var(--app-font-score)" }}>
        You're all set{name ? `, ${name}` : ""}.
      </h2>
      <p className="text-base text-muted-foreground mb-10">Your dashboard is ready.</p>

      {error && (
        <div className="w-full mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive text-left">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onFinish}
        disabled={submitting}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-sm font-black uppercase tracking-widest bg-primary text-primary-foreground transition-all duration-150 active:scale-95 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Saving…" : <>Go to Dashboard <ArrowRight className="w-4 h-4" /></>}
      </button>
    </div>
  );
}

// ── Main Onboarding ───────────────────────────────────────────────────────────

const EMPTY_INTERESTS = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, { selected: [], freeText: "" }])
) as Record<CategoryId, InterestState>;

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    ageRange: "",
    demographicType: "",
    interests: EMPTY_INTERESTS,
  });

  function updateForm(updates: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  async function handleFinish() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          ageRange: form.ageRange || undefined,
          demographicType: form.demographicType || undefined,
          interests: form.interests,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? "Something went wrong");
      }
      const data = await res.json() as { userId: string };
      localStorage.setItem("signalos_onboarding_complete", "1");
      localStorage.setItem("signalos_user_id", data.userId);
      onComplete();
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 0) return <WelcomeScreen onNext={() => setStep(1)} />;
  if (step === 1) return <AboutYouScreen form={form} onChange={updateForm} onNext={() => setStep(2)} />;
  if (step === 2) return <InterestsScreen form={form} onChange={updateForm} onNext={() => setStep(3)} />;
  if (step === 3) return <PrivacyScreen onNext={() => setStep(4)} />;
  return (
    <DoneScreen
      name={form.name}
      onFinish={handleFinish}
      submitting={submitting}
      error={submitError}
    />
  );
}
