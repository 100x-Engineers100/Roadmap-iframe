"use client";
import IntakeForm from "@/components/IntakeForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-10 text-center">
          <p className="font-mono text-xs text-[#888] tracking-widest uppercase mb-3">100x Engineers</p>
          <h1 className="font-clash text-4xl md:text-5xl font-bold text-[#232323] leading-tight">
            Build Your <span className="text-[#FF6343]">AI Roadmap</span>
          </h1>
          <p className="mt-3 text-[#888] text-base">Answer 7 questions. Get a personalized roadmap grounded in 100x curriculum.</p>
        </div>
        <IntakeForm />
      </div>
    </main>
  );
}
