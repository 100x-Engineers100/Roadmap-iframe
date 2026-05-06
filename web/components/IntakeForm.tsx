"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

const GOALS = [
  "Become an AI engineer",
  "Build AI agents",
  "Become an AI product builder",
  "Use AI in my current career",
  "Build AI content or ads",
  "Start an AI automation business",
  "Master diffusion / image-video AI",
];

const WEAK_AREAS = [
  "Programming fundamentals",
  "Web development",
  "AI and LLMs",
  "System design",
  "Data and ML",
  "Product thinking",
  "Deployment and DevOps",
  "Consistency and accountability",
];

const HOURS = ["2–4 hours", "5–8 hours", "9–15 hours", "15+ hours"];
const LEARNING_STYLES = ["Building projects", "Watching videos", "Reading docs", "Guided tasks", "Mixed"];
const ROLES = ["Student", "Software developer", "Designer", "Product manager", "Founder or operator", "Data analyst", "Cybersecurity professional", "Hardware engineer", "Non-tech professional", "Other"];
const EXPERIENCE = ["Less than 1 year", "1–3 years", "3–7 years", "7+ years"];

interface FormData {
  name: string;
  goal: string;
  goalCustom: string;
  timeframe_months: number;
  background_role: string;
  experience_years: string;
  weak_areas: string[];
  hours_per_week: string;
  learning_style: string;
  mobile: string;
}

const EMPTY: FormData = {
  name: "", goal: "", goalCustom: "", timeframe_months: 0,
  background_role: "", experience_years: "", weak_areas: [],
  hours_per_week: "", learning_style: "", mobile: "",
};

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-sm text-sm font-medium border transition-all cursor-pointer
        ${selected
          ? "bg-[#FF6343] border-[#FF6343] text-white shadow-hard-coral"
          : "bg-white border-[#E2BFB7] text-[#1A1C1C] hover:border-[#FF6343] hover:text-[#FF6343]"
        }`}
    >
      {label}
    </button>
  );
}

function OptionCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 min-w-[120px] py-4 px-5 rounded-sm border-2 text-sm font-semibold transition-all cursor-pointer
        ${selected
          ? "border-[#FF6343] bg-[#FFE1DB] text-[#FF6343] shadow-hard-coral"
          : "border-[#E2BFB7] bg-white text-[#1A1C1C] hover:border-[#FF6343] hover:bg-[#FFF5F3]"
        }`}
    >
      {label}
    </button>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-7">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{ transition: "all 0.4s ease" }}
          className={`h-[3px] flex-1 rounded-full
            ${i < current ? "bg-[#FF6343]" : i === current ? "bg-[#FF6343] opacity-35" : "bg-[#E2BFB7]"}`}
        />
      ))}
    </div>
  );
}

const STEP_LABELS = ["Name", "Goal", "Timeline", "Background", "Gaps", "Hours", "Style"];

export default function IntakeForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();
  const TOTAL_STEPS = 7;

  function update<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  function toggleWeak(area: string) {
    setForm((p) => ({
      ...p,
      weak_areas: p.weak_areas.includes(area)
        ? p.weak_areas.filter((a) => a !== area)
        : [...p.weak_areas, area],
    }));
  }

  function canNext(): boolean {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return (form.goal || form.goalCustom).trim().length > 0;
    if (step === 2) return form.timeframe_months > 0;
    if (step === 3) return !!form.background_role && !!form.experience_years;
    if (step === 4) return form.weak_areas.length > 0;
    if (step === 5) return !!form.hours_per_week;
    if (step === 6) return !!form.learning_style;
    if (step === 7) return /^[6-9]\d{9}$/.test(form.mobile);
    return false;
  }

  async function handleGoogleAuth() {
    if (!canNext()) return;
    setLoading(true);
    setError("");
    sessionStorage.setItem("intake", JSON.stringify(form));
    const { data, error: authErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (authErr) { setError(authErr.message); setLoading(false); }
    void data;
  }

  const qHeader = (label: string, hint?: string) => (
    <div className="mb-5">
      <p className="font-mono text-[10px] text-[#FF6343] tracking-[0.12em] uppercase mb-1.5">
        Step {step + 1} of {TOTAL_STEPS} — {STEP_LABELS[step]}
      </p>
      <h2 className="font-clash text-2xl font-bold text-[#1A1C1C] leading-snug">{label}</h2>
      {hint && <p className="text-sm text-[#5A413B] mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="intake-card bg-white border border-[#E2BFB7] rounded-2xl p-6">
      {step < 7 && <StepIndicator current={step} total={TOTAL_STEPS} />}

      {/* Step content — key forces re-mount → triggers step-in animation */}
      <div key={step} className="step-in">

        {step === 0 && (
          <div>
            {qHeader("What should we call you?")}
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Your name"
              maxLength={50}
              autoFocus
              className="w-full border-2 border-[#E2BFB7] rounded-sm px-4 py-3 text-base focus:outline-none focus:border-[#FF6343] bg-[#F9F9F9] transition-colors"
            />
          </div>
        )}

        {step === 1 && (
          <div>
            {qHeader("What AI outcome do you want?", "Pick one, then customize if needed.")}
            <div className="flex flex-wrap gap-2 mb-4">
              {GOALS.map((g) => (
                <Chip
                  key={g} label={g} selected={form.goal === g}
                  onClick={() => { update("goal", g); update("goalCustom", g); }}
                />
              ))}
            </div>
            <input
              type="text"
              value={form.goalCustom}
              onChange={(e) => update("goalCustom", e.target.value)}
              placeholder="Or describe your goal..."
              className="w-full border-2 border-[#E2BFB7] rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-[#FF6343] bg-[#F9F9F9] transition-colors"
            />
          </div>
        )}

        {step === 2 && (
          <div>
            {qHeader("How long do you want your roadmap?")}
            <div className="flex gap-4">
              <OptionCard label="3 Months" selected={form.timeframe_months === 3} onClick={() => update("timeframe_months", 3)} />
              <OptionCard label="6 Months" selected={form.timeframe_months === 6} onClick={() => update("timeframe_months", 6)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            {qHeader("What is your current background?")}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <select
                  value={form.background_role}
                  onChange={(e) => update("background_role", e.target.value)}
                  className="w-full appearance-none border-2 border-[#E2BFB7] rounded-lg px-4 py-3 pr-10 text-sm bg-[#F9F9F9] focus:outline-none focus:border-[#FF6343] focus:bg-white transition-all cursor-pointer text-[#1A1C1C]"
                >
                  <option value="" disabled>Role...</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#FF6343]" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="relative">
                <select
                  value={form.experience_years}
                  onChange={(e) => update("experience_years", e.target.value)}
                  className="w-full appearance-none border-2 border-[#E2BFB7] rounded-lg px-4 py-3 pr-10 text-sm bg-[#F9F9F9] focus:outline-none focus:border-[#FF6343] focus:bg-white transition-all cursor-pointer text-[#1A1C1C]"
                >
                  <option value="" disabled>Experience...</option>
                  {EXPERIENCE.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#FF6343]" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            {qHeader("What are your weakest areas?", "Pick all that apply.")}
            <div className="flex flex-wrap gap-2">
              {WEAK_AREAS.map((a) => (
                <Chip key={a} label={a} selected={form.weak_areas.includes(a)} onClick={() => toggleWeak(a)} />
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            {qHeader("How many hours per week can you commit?")}
            <div className="flex flex-wrap gap-3">
              {HOURS.map((h) => (
                <OptionCard key={h} label={h} selected={form.hours_per_week === h} onClick={() => update("hours_per_week", h)} />
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            {qHeader("How do you learn best?")}
            <div className="flex flex-wrap gap-3">
              {LEARNING_STYLES.map((s) => (
                <OptionCard key={s} label={s} selected={form.learning_style === s} onClick={() => update("learning_style", s)} />
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div>
            <div className="mb-5">
              <h2 className="font-clash text-2xl font-bold text-[#1A1C1C] leading-snug">Almost there</h2>
              <p className="text-sm text-[#5A413B] mt-1">One last thing before we generate your roadmap.</p>
            </div>
            <div className="flex border-2 border-[#E2BFB7] rounded-sm overflow-hidden bg-[#F9F9F9] mb-4 focus-within:border-[#FF6343] transition-colors">
              <span className="px-4 py-3 text-sm font-mono text-[#5A413B] border-r-2 border-[#E2BFB7] bg-white select-none">+91</span>
              <input
                type="tel"
                value={form.mobile}
                onChange={(e) => update("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
                className="flex-1 px-4 py-3 text-base bg-transparent focus:outline-none"
              />
            </div>
            <p className="text-xs text-[#888] mb-6 leading-relaxed">
              By generating your roadmap, you agree to receive personalized roadmap reminders.
            </p>
            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
            <button
              onClick={handleGoogleAuth}
              disabled={!canNext() || loading}
              className="w-full py-4 bg-[#FF6343] text-white font-semibold rounded-sm hover:bg-[#B22C11] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-hard-coral"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full" style={{ animation: "spin 0.8s linear infinite" }} />
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#fff" />
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#fff" opacity=".8" />
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#fff" opacity=".6" />
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#fff" opacity=".4" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>
        )}

      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E2BFB7]">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="text-sm text-[#5A413B] hover:text-[#1A1C1C] transition-colors font-medium"
          >
            ← Back
          </button>
        ) : <div />}

        {step < 7 && (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className="px-6 py-3 bg-[#FF6343] text-white text-sm font-semibold rounded-xl hover:bg-[#B22C11] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
