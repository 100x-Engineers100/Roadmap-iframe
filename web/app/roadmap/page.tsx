"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Suspense } from "react";

type Status = "loading" | "generating" | "complete" | "failed";

function RoadmapContent() {
  const params = useSearchParams();
  const router = useRouter();
  const roadmapId = params.get("id");
  const [status, setStatus] = useState<Status>("loading");
  const [svgUrl, setSvgUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!roadmapId) { router.replace("/"); return; }

    async function poll() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/"); return; }

      setStatus("generating");

      intervalRef.current = setInterval(async () => {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/status?id=${roadmapId}`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "complete") {
          clearInterval(intervalRef.current!);
          setSvgUrl(data.svg_url);
          setStatus("complete");
        } else if (data.status === "failed") {
          clearInterval(intervalRef.current!);
          setError(data.error_message ?? "Generation failed");
          setStatus("failed");
        }
      }, 3000);
    }

    poll();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [roadmapId, router]);

  async function downloadSVG() {
    if (!svgUrl) return;
    const res = await fetch(svgUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "100x-roadmap.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (status === "loading" || status === "generating") {
    return (
      <main className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center gap-6">
        <div className="animate-spin h-10 w-10 border-2 border-[#FF6343] border-t-transparent rounded-full" />
        <div className="text-center">
          <p className="font-clash text-xl font-bold text-[#232323]">Building your roadmap</p>
          <p className="text-sm text-[#888] mt-1 font-mono">Analysing 100x curriculum → generating plan → rendering SVG</p>
        </div>
        <div className="flex gap-1 mt-2">
          {[0,1,2].map((i) => (
            <div
              key={i}
              className="h-1.5 w-8 bg-[#FF6343] rounded-full opacity-40 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </main>
    );
  }

  if (status === "failed") {
    return (
      <main className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 font-semibold">Generation failed</p>
        <p className="text-sm text-[#888]">{error}</p>
        <button onClick={() => router.replace("/")} className="mt-4 px-6 py-3 bg-[#FF6343] text-white rounded-sm text-sm font-semibold hover:bg-[#e5522e]">
          Try again
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F7F7] py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-mono text-xs text-[#888] uppercase tracking-widest">100x Engineers</p>
            <h1 className="font-clash text-2xl font-bold text-[#232323] mt-1">Your AI Roadmap</h1>
          </div>
          <button
            onClick={downloadSVG}
            className="flex items-center gap-2 px-5 py-3 bg-[#FF6343] text-white text-sm font-semibold rounded-sm hover:bg-[#e5522e] transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download SVG
          </button>
        </div>

        <div className="bg-white border border-[#E0DDD8] rounded-sm overflow-hidden shadow-sm">
          {svgUrl && (
            <img
              src={svgUrl}
              alt="Your AI Roadmap"
              className="w-full h-auto"
            />
          )}
        </div>

        <p className="text-center text-xs text-[#888] font-mono mt-6">
          Built with 100x Engineers curriculum · 100xengineers.com
        </p>
      </div>
    </main>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense>
      <RoadmapContent />
    </Suspense>
  );
}
