"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface CardData {
  id: string;
  name: string;
  subtitle: string;
  img: string;
  keywords: string[];
  desc: string;
}

interface ReadingData {
  cards: CardData[];
  reading: string;
  question: string;
  deckName: string;
  shareId: string;
}

const POSITIONS = ["Past", "Present", "Future", "Guidance"];

function ReadingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const cardsParam = searchParams.get("cards") || "";
  const questionParam = searchParams.get("q") || "";
  const deckParam = searchParams.get("deck") || "mayan";

  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<ReadingData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [audioState, setAudioState] = useState<"idle" | "loading" | "playing" | "paused" | "error">("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [focusCard, setFocusCard] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!cardsParam) {
      setErrorMsg("No cards selected. Please go back and choose your cards.");
      setState("error");
      return;
    }

    const cardIds = cardsParam.split(",").filter(Boolean);
    const cacheKey = `reading:${cardsParam}:${questionParam}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setData(JSON.parse(cached));
        setState("ready");
        return;
      }
    } catch { /* ignore */ }

    fetch("/api/free-reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardIds,
        question: decodeURIComponent(questionParam),
        deckId: deckParam,
      }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { setErrorMsg(json.error); setState("error"); }
        else {
          setData(json);
          try { sessionStorage.setItem(`reading:${cardsParam}:${questionParam}`, JSON.stringify(json)); } catch { /* ignore */ }
          setState("ready");
        }
      })
      .catch(() => {
        setErrorMsg("Failed to generate your reading. Please try again.");
        setState("error");
      });
  }, [cardsParam, questionParam]);

  const loadAudio = async () => {
    if (!data) return;
    if (audioRef.current) {
      audioRef.current.play();
      setAudioState("playing");
      return;
    }
    setAudioState("loading");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: data.reading }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setAudioState("paused");
      audio.play();
      setAudioState("playing");
    } catch {
      setAudioState("error");
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) { loadAudio(); return; }
    if (audioState === "playing") { audioRef.current.pause(); setAudioState("paused"); }
    else { audioRef.current.play(); setAudioState("playing"); }
  };

  const replay = () => {
    if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); setAudioState("playing"); }
    else loadAudio();
  };

  const share = () => {
    if (!data) return;
    const url = `${window.location.origin}/share/${data.shareId}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  if (state === "loading") {
    return (
      <div style={pageStyle}>
        <style>{keyframes}</style>
        <Nav />
        <div style={{ textAlign: "center", paddingTop: "120px" }}>
          <div style={spinnerStyle} />
          <p style={{ color: "rgba(196,144,64,0.8)", marginTop: "28px", fontSize: "16px", letterSpacing: "0.12em" }}>
            The oracle is speaking…
          </p>
          <p style={{ color: "rgba(210,180,130,0.3)", marginTop: "8px", fontSize: "13px" }}>
            Your reading is being prepared
          </p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div style={pageStyle}>
        <style>{keyframes}</style>
        <Nav />
        <div style={{ textAlign: "center", padding: "100px 24px 0", maxWidth: "480px", margin: "0 auto" }}>
          <p style={{ color: "#ef476f", marginBottom: "12px", fontSize: "16px" }}>Something went wrong</p>
          <p style={{ color: "rgba(210,180,130,0.5)", marginBottom: "32px", fontSize: "14px" }}>{errorMsg}</p>
          <button onClick={() => router.push("/")} style={btnSecondary}>← Choose new cards</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const audioLabel = audioState === "loading" ? "Loading…"
    : audioState === "playing" ? "⏸  Pause"
    : audioState === "paused" ? "▶  Resume"
    : audioState === "error" ? "Audio unavailable"
    : "▶  Listen to your reading";

  return (
    <div style={pageStyle}>
      <style>{keyframes}</style>
      <Nav />

      <main style={{ maxWidth: "1520px", margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <span style={{
            display: "inline-block",
            background: "rgba(196,144,64,0.1)",
            border: "1px solid rgba(196,144,64,0.28)",
            borderRadius: "20px",
            padding: "7px 24px",
            fontSize: "16px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#c49040",
            marginBottom: "14px",
          }}>
            {data.deckName} · Your Reading
          </span>
          {data.question && data.question !== "No specific question — an open reading." && (
            <p style={{ color: "rgba(230,210,160,0.5)", fontSize: "22px", fontStyle: "italic" }}>
              "{data.question}"
            </p>
          )}
        </div>

        {/* ── BIG CARDS ──────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 560px))",
          gap: "clamp(16px, 2.5vw, 40px)",
          justifyContent: "center",
          margin: "0 auto 52px",
        }}>
          {data.cards.map((card, i) => (
            <div
              key={card.id}
              onClick={() => setFocusCard(focusCard === i ? null : i)}
              style={{
                cursor: "pointer",
                animation: `fadeInUp 0.6s ease ${i * 0.12}s both`,
                transition: "transform 0.2s ease",
                transform: focusCard === i ? "scale(1.04)" : "scale(1)",
              }}
            >
              {/* Position label */}
              <p style={{
                textAlign: "center",
                fontSize: "16px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(196,144,64,0.7)",
                marginBottom: "12px",
              }}>
                {POSITIONS[i]}
              </p>

              {/* Card image */}
              <div style={{
                borderRadius: "14px",
                overflow: "hidden",
                boxShadow: focusCard === i
                  ? "0 24px 70px rgba(196,144,64,0.35), 0 0 0 2px rgba(196,144,64,0.4)"
                  : "0 10px 50px rgba(0,0,0,0.7)",
                border: "1px solid rgba(255,255,255,0.08)",
                transition: "box-shadow 0.2s ease",
              }}>
                <img
                  src={card.img}
                  alt={card.name}
                  style={{ width: "100%", display: "block" }}
                />
              </div>

              {/* Card name */}
              <p style={{
                textAlign: "center",
                fontSize: "20px",
                color: focusCard === i ? "#c49040" : "rgba(240,235,224,0.85)",
                marginTop: "14px",
                fontWeight: "700",
                letterSpacing: "0.03em",
                transition: "color 0.2s",
              }}>
                {card.name}
              </p>
              <p style={{
                textAlign: "center",
                fontSize: "15px",
                color: "rgba(210,180,130,0.45)",
                marginTop: "4px",
                fontStyle: "italic",
              }}>
                {card.subtitle}
              </p>

              {/* Expanded detail */}
              {focusCard === i && (
                <div style={{
                  marginTop: "16px",
                  background: "rgba(20,12,6,0.9)",
                  border: "1px solid rgba(196,144,64,0.15)",
                  borderRadius: "10px",
                  padding: "16px",
                  animation: "fadeInUp 0.3s ease",
                }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                    {card.keywords.map((kw) => (
                      <span key={kw} style={{
                        background: "rgba(196,144,64,0.08)",
                        border: "1px solid rgba(196,144,64,0.2)",
                        borderRadius: "4px",
                        padding: "3px 8px",
                        fontSize: "13px",
                        color: "#c49040",
                        letterSpacing: "0.06em",
                      }}>{kw}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: "15px", color: "rgba(240,235,224,0.7)", lineHeight: 1.65 }}>
                    {card.desc.length > 180 ? card.desc.slice(0, 180) + "…" : card.desc}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── AUDIO CONTROLS ──────────────────────────── */}
        <div style={{
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: "40px",
        }}>
          <button
            onClick={togglePlay}
            disabled={audioState === "loading" || audioState === "error"}
            style={{
              ...btnPrimary,
              minWidth: "210px",
              opacity: audioState === "loading" ? 0.7 : 1,
              fontSize: "16px",
              padding: "16px 32px",
            }}
          >
            {audioLabel}
          </button>
          {(audioState === "playing" || audioState === "paused") && (
            <button onClick={replay} style={{ ...btnSecondary, padding: "16px 24px" }}>↺  Replay</button>
          )}
          <button onClick={share} style={{ ...btnSecondary, padding: "16px 24px" }}>
            {copied ? "✓ Copied!" : "⎘  Share"}
          </button>
        </div>

        {/* ── READING TEXT ─────────────────────────────── */}
        <div style={{
          background: "rgba(14,8,4,0.85)",
          border: "1px solid rgba(196,144,64,0.1)",
          borderRadius: "18px",
          padding: "clamp(24px, 5vw, 48px)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 60px rgba(0,0,0,0.5)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "36px" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(196,144,64,0.12)" }} />
            <span style={{ fontSize: "18px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#c49040" }}>
              Your Reading
            </span>
            <div style={{ flex: 1, height: "1px", background: "rgba(196,144,64,0.12)" }} />
          </div>
          {data.reading.split("\n\n").filter(Boolean).map((para, i) => (
            <p key={i} style={{
              color: "rgba(240,235,224,0.88)",
              fontSize: "clamp(20px, 2.2vw, 26px)",
              lineHeight: 1.85,
              marginBottom: "30px",
              animation: `fadeInUp 0.7s ease ${0.15 + i * 0.12}s both`,
            }}>
              {para}
            </p>
          ))}
        </div>

        {/* Footer actions */}
        <div style={{ textAlign: "center", marginTop: "60px", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px" }}>
          <button onClick={share} style={{ ...btnPrimary, fontSize: "18px" }}>
            {copied ? "✓ Link copied!" : "Share this reading ✦"}
          </button>
          <button onClick={() => router.push("/")} style={{
            background: "none", border: "none",
            color: "rgba(196,144,64,0.4)", fontSize: "17px",
            cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.06em",
          }}>
            ← Get another reading
          </button>
        </div>
      </main>
    </div>
  );
}

function Nav() {
  return (
    <nav style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <a href="/" style={{
        fontSize: "20px", fontWeight: "700", letterSpacing: "0.05em", textDecoration: "none",
        background: "linear-gradient(90deg, #c49040 0%, #e8a020 40%, #8b4513 80%, #c49040 100%)",
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}>
        Mayan Oracle
      </a>
      <a href="/gallery" style={{ color: "rgba(196,144,64,0.45)", fontSize: "13px", textDecoration: "none" }}>
        Study the Cards
      </a>
    </nav>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(160deg, #0c0804 0%, #100a04 60%, #0e0808 100%)",
  color: "#f0ebe0",
  fontFamily: "'Georgia', serif",
};

const btnPrimary: React.CSSProperties = {
  background: "linear-gradient(135deg, #c49040, #e8a020)",
  color: "#0c0804",
  border: "none",
  borderRadius: "8px",
  padding: "14px 28px",
  fontSize: "15px",
  fontFamily: "inherit",
  fontWeight: "800",
  cursor: "pointer",
  letterSpacing: "0.06em",
};

const btnSecondary: React.CSSProperties = {
  background: "none",
  color: "#c49040",
  border: "1px solid rgba(6,214,160,0.3)",
  borderRadius: "8px",
  padding: "14px 24px",
  fontSize: "15px",
  fontFamily: "inherit",
  cursor: "pointer",
  letterSpacing: "0.04em",
};

const spinnerStyle: React.CSSProperties = {
  width: "44px",
  height: "44px",
  border: "2px solid rgba(196,144,64,0.15)",
  borderTopColor: "#c49040",
  borderRadius: "50%",
  animation: "spin 0.9s linear infinite",
  margin: "0 auto",
};

const keyframes = `
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export default function ReadingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0c0804", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "rgba(196,144,64,0.5)", fontFamily: "Georgia, serif", letterSpacing: "0.1em" }}>Loading…</p>
      </div>
    }>
      <ReadingContent />
    </Suspense>
  );
}
