"use client";
import { useRef, useEffect } from "react";
import IntakeForm from "@/components/IntakeForm";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4";

const CROSSFADE_TRIGGER = 3.5; // seconds before end to start crossfade
const CROSSFADE_MS = 2500;    // crossfade duration in ms

const VIDEO_STYLE: React.CSSProperties = {
  position: "fixed",
  top: "-8%",
  left: "50%",
  transform: "translateX(-50%)",
  width: "115%",
  height: "120%",
  objectFit: "cover",
  objectPosition: "center 20%",
  zIndex: 0,
  opacity: 0,
  transition: `opacity ${CROSSFADE_MS}ms ease`,
};

function VideoBackground() {
  const vid1Ref = useRef<HTMLVideoElement>(null);
  const vid2Ref = useRef<HTMLVideoElement>(null);
  // which video is currently the "active" (visible) one
  const activeRef = useRef<1 | 2>(1);
  const crossfadingRef = useRef(false);

  useEffect(() => {
    const vid1 = vid1Ref.current!;
    const vid2 = vid2Ref.current!;

    // Fade in vid1 on first ready
    vid1.addEventListener("canplay", () => { vid1.style.opacity = "1"; }, { once: true });
    vid1.play().catch(() => {});

    const startCrossfade = () => {
      if (crossfadingRef.current) return;
      crossfadingRef.current = true;

      const outVid = activeRef.current === 1 ? vid1 : vid2;
      const inVid  = activeRef.current === 1 ? vid2 : vid1;

      inVid.currentTime = 0;

      const doSwap = () => {
        // CSS transition handles the smooth opacity change — no RAF needed
        outVid.style.opacity = "0";
        inVid.style.opacity  = "1";

        setTimeout(() => {
          outVid.pause();
          outVid.currentTime = 0;
          activeRef.current  = activeRef.current === 1 ? 2 : 1;
          crossfadingRef.current = false;
        }, CROSSFADE_MS + 100);
      };

      // Wait for inVid to have its first frame before revealing it
      if (inVid.readyState >= 3) {
        inVid.play().then(doSwap).catch(doSwap);
      } else {
        inVid.addEventListener("canplay", () => {
          inVid.play().then(doSwap).catch(doSwap);
        }, { once: true });
        inVid.load();
      }
    };

    const onTimeUpdate = () => {
      if (crossfadingRef.current) return;
      const active = activeRef.current === 1 ? vid1 : vid2;
      if (!active.duration) return;
      if (active.duration - active.currentTime <= CROSSFADE_TRIGGER) {
        startCrossfade();
      }
    };

    vid1.addEventListener("timeupdate", onTimeUpdate);
    vid2.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      vid1.removeEventListener("timeupdate", onTimeUpdate);
      vid2.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, []);

  return (
    <>
      <video ref={vid1Ref} src={VIDEO_SRC} autoPlay muted playsInline preload="auto" style={VIDEO_STYLE} />
      <video ref={vid2Ref} src={VIDEO_SRC} muted playsInline preload="auto" style={{ ...VIDEO_STYLE }} />
    </>
  );
}

export default function Home() {
  return (
    <div
      style={{
        fontFamily: "var(--font-space-grotesk), sans-serif",
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        background: "#0a0a0a",
      }}
    >
      <VideoBackground />

      {/* Dim overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.45) 100%)",
          pointerEvents: "none",
        }}
      />


      {/* Centered hero */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "0 16px 16px",
          marginTop: "-60px",
        }}
      >
        {/* Apple liquid glass tile — wraps entire content */}
        <div
          className="frozen-glass animate-in"
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "min(520px, calc(100vw - 24px))",
            padding: "clamp(16px, 3vw, 22px) clamp(16px, 4vw, 36px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            animationDelay: "0ms",
          }}
        >
          {/* All children sit above the ::before shine */}
          <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "999px",
                background: "rgba(255,99,67,0.12)",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#FF6343",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                100x Engineers
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "clamp(22px, 3.5vw, 34px)",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-2px",
                lineHeight: 1.05,
                textAlign: "center",
                margin: "0 0 8px",
              }}
            >
              Build Your{" "}
              <span
                style={{
                  color: "#FF6343",
                  position: "relative",
                  display: "inline-block",
                }}
              >
                AI Roadmap
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: "-4px",
                    width: "100%",
                    height: "3px",
                    background: "#FF6343",
                    borderRadius: "2px",
                  }}
                />
              </span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: "14px",
                fontWeight: 400,
                color: "rgba(255,255,255,0.60)",
                textAlign: "center",
                maxWidth: "340px",
                lineHeight: 1.6,
                margin: "0 0 14px",
              }}
            >
              7 questions. Personalized plan grounded in 100x cohort curriculum.
            </p>

            {/* Form */}
            <div style={{ width: "100%" }}>
              <IntakeForm />
            </div>

            {/* Footer label */}
            <p
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "12px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.55)",
                letterSpacing: "0.12em",
                marginTop: "10px",
              }}
            >
              MAP IT - DO IT
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
