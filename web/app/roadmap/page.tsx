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
  const [htmlUrl, setHtmlUrl] = useState<string | null>(null);
  const [roadmapHtml, setRoadmapHtml] = useState<string | null>(null);
  const [error, setError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!roadmapId) { router.replace("/"); return; }
    const supabase = createClient();

    async function poll() {
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
          setHtmlUrl(data.svg_url);
          const htmlRes = await fetch(data.svg_url);
          const html = await htmlRes.text();
          setRoadmapHtml(html);
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

  async function downloadRoadmap() {
    if (!htmlUrl) return;
    const res = await fetch(htmlUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "100x-roadmap.html"; a.click();
    URL.revokeObjectURL(url);
  }

  if (status === "loading" || status === "generating") {
    return (
      <div className="min-h-screen bg-grid flex flex-col items-center justify-center px-4">
        <div className="bg-white border border-[#E2BFB7] rounded-sm p-10 max-w-sm w-full shadow-hard animate-in">
          <div className="relative h-1 bg-[#E2BFB7] rounded-full overflow-hidden mb-8">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-[#FF6343] rounded-full" style={{ animation: "scanLine 1.8s ease-in-out infinite" }} />
          </div>
          <p className="font-mono text-[10px] text-[#FF6343] tracking-[0.15em] uppercase mb-2">100x Engineers</p>
          <p className="font-clash text-2xl font-bold text-[#1A1C1C] mb-1">Building your roadmap</p>
          <p className="text-sm text-[#5A413B]">Analysing curriculum → generating plan → rendering SVG</p>
          <div className="flex gap-1.5 mt-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-1 flex-1 rounded-full bg-[#FF6343]" style={{ animation: `barPulse 1.2s ease infinite`, animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen bg-grid flex flex-col items-center justify-center px-4">
        <div className="bg-white border border-[#E2BFB7] rounded-sm p-8 max-w-sm w-full shadow-hard text-center animate-in">
          <p className="font-clash text-xl font-bold text-[#1A1C1C] mb-2">Generation failed</p>
          <p className="text-sm text-[#5A413B] mb-6">{error}</p>
          <button onClick={() => router.replace("/")} className="w-full py-3 bg-[#FF6343] text-white font-semibold rounded-sm text-sm hover:bg-[#B22C11] transition-colors shadow-hard-coral">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 animate-in">
          <div>
            <p className="font-mono text-[10px] text-[#FF6343] tracking-[0.15em] uppercase mb-1">100x Engineers</p>
            <h1 className="font-clash text-3xl font-bold text-[#1A1C1C]">Your AI Roadmap</h1>
            <p className="text-sm text-[#5A413B] mt-1">Download and start today.</p>
          </div>
          <button
            onClick={downloadRoadmap}
            className="flex items-center gap-2 px-5 py-3 bg-[#FF6343] text-white text-sm font-semibold rounded-sm hover:bg-[#B22C11] transition-colors shadow-hard-coral"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>

        {/* Roadmap display */}
        <div
          className="bg-white border-2 border-[#E2BFB7] rounded-sm overflow-hidden shadow-hard animate-in"
          style={{ animationDelay: "80ms" }}
          dangerouslySetInnerHTML={roadmapHtml ? { __html: roadmapHtml } : undefined}
        />

        <p className="text-center font-mono text-[11px] text-[#888] mt-8 tracking-wider">
          Built with 100x Engineers curriculum · 100xengineers.com
        </p>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return <Suspense><RoadmapContent /></Suspense>;
}
