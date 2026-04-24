"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function GeneratePage() {
  const router = useRouter();
  const [status, setStatus] = useState("Checking session...");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();

    async function submit(accessToken: string) {
      const raw = sessionStorage.getItem("intake");
      if (!raw) {
        setError("Intake data missing. Please start over.");
        return;
      }

      const intake = JSON.parse(raw);
      setStatus("Submitting your roadmap...");

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
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

    // Try existing session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        submit(session.access_token);
        return;
      }
      // Wait for auth state (fires after OAuth redirect)
      setStatus("Waiting for Google auth...");
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          subscription.unsubscribe();
          submit(session.access_token);
        }
      });
    });
  }, [router]);

  if (error) {
    return (
      <main className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 font-semibold">Something went wrong</p>
        <p className="text-sm text-[#888] max-w-sm text-center">{error}</p>
        <button onClick={() => router.replace("/")} className="mt-4 px-6 py-3 bg-[#FF6343] text-white rounded-sm text-sm font-semibold hover:bg-[#e5522e]">
          Start over
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center gap-4">
      <div className="animate-spin h-8 w-8 border-2 border-[#FF6343] border-t-transparent rounded-full" />
      <p className="text-[#888] text-sm font-mono">{status}</p>
    </main>
  );
}
