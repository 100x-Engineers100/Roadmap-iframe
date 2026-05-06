"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const STEPS = [
  "Authenticating session",
  "Reading your intake answers",
  "Fetching 100x curriculum",
  "Generating your roadmap",
  "Rendering SVG",
];

export default function GeneratePage() {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState("");

  // Cycle step labels for visual effect
  useEffect(() => {
    const id = setInterval(() => setStepIdx((i) => Math.min(i + 1, STEPS.length - 1)), 3500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function submit(accessToken: string) {
      const raw = sessionStorage.getItem("intake");
      if (!raw) { setError("Intake data missing. Please start over."); return; }

      const intake = JSON.parse(raw);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              goal: intake.goalCustom || intake.goal,
              background_role: intake.background_role,
              experience_years: intake.experience_years,
              weak_areas: intake.weak_areas,
              hours_per_week: intake.hours_per_week,
              learning_style: intake.learning_style,
              timeframe_months: intake.timeframe_months,
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          setError(err.error ?? "Generation failed");
          return;
        }
        const { roadmap_id } = await res.json();
        sessionStorage.removeItem("intake");
        router.replace(`/roadmap?id=${roadmap_id}`);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg.includes("abort") ? "Request timed out. Try again." : msg);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { submit(session.access_token); return; }
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) { subscription.unsubscribe(); submit(session.access_token); }
      });
    });
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-grid flex flex-col items-center justify-center gap-4 px-4">
        <div className="bg-white border border-[#E2BFB7] rounded-sm p-8 max-w-sm w-full shadow-hard text-center">
          <p className="font-clash text-xl font-bold text-[#1A1C1C] mb-2">Something went wrong</p>
          <p className="text-sm text-[#5A413B] mb-6">{error}</p>
          <button onClick={() => router.replace("/")} className="w-full py-3 bg-[#FF6343] text-white font-semibold rounded-sm text-sm hover:bg-[#B22C11] transition-colors shadow-hard-coral">
            Start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid flex flex-col items-center justify-center px-4">
      <div className="bg-white border border-[#E2BFB7] rounded-sm p-10 max-w-sm w-full shadow-hard animate-in">
        {/* Scan bar */}
        <div className="relative h-1 bg-[#E2BFB7] rounded-full overflow-hidden mb-8">
          <div
            className="absolute top-0 left-0 h-full w-1/3 bg-[#FF6343] rounded-full"
            style={{ animation: "scanLine 1.8s ease-in-out infinite" }}
          />
        </div>

        <p className="font-mono text-[10px] text-[#FF6343] tracking-[0.15em] uppercase mb-2">100x Engineers</p>
        <p className="font-clash text-2xl font-bold text-[#1A1C1C] mb-1">Building your roadmap</p>

        {/* Step label */}
        <p key={stepIdx} className="text-sm text-[#5A413B] step-in mb-6">
          {STEPS[stepIdx]}...
        </p>

        {/* Progress dots */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= stepIdx ? "bg-[#FF6343]" : "bg-[#E2BFB7]"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
