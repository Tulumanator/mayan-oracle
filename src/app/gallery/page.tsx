"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TULUM_CARDS } from "@/data/tulum-cards";
import { MAYAN_CARDS } from "@/data/mayan-cards";

type Deck = "tulum" | "mayan";
type Tab = "gallery" | "oracle";

const DECKS = {
  tulum: { label: "Tulum Oracle", cards: TULUM_CARDS },
  mayan: { label: "Mayan Oracle", cards: MAYAN_CARDS },
};

function GalleryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = searchParams.get("tab") === "oracle" ? "oracle" : "gallery";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [deck, setDeck] = useState<Deck>("mayan");
  const [index, setIndex] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  const cards = DECKS[deck].cards;
  const card = cards[index];

  const prev = useCallback(() => {
    speechSynthesis.cancel();
    setSpeaking(false);
    setIndex((i) => (i - 1 + cards.length) % cards.length);
  }, [cards.length]);

  const next = useCallback(() => {
    speechSynthesis.cancel();
    setSpeaking(false);
    setIndex((i) => (i + 1) % cards.length);
  }, [cards.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prev, next]);

  // Touch swipe
  useEffect(() => {
    let startX = 0;
    const onTouchStart = (e: TouchEvent) => (startX = e.touches[0].clientX);
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [prev, next]);

  const listen = async () => {
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const desc = typeof card.desc === "string" ? card.desc : (card.desc as { en: string }).en;
    const text = `${card.name}. ${card.subtitle}. ${desc}`;

    // Prefer ElevenLabs if available, fall back to Web Speech API
    try {
      setAudioLoading(true);
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("tts failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => setSpeaking(false);
      audio.play();
      setSpeaking(true);
      setAudioLoading(false);
    } catch {
      // Fallback to Web Speech API
      setAudioLoading(false);
      const utter = new SpeechSynthesisUtterance(text);
      utter.onend = () => setSpeaking(false);
      speechSynthesis.speak(utter);
      setSpeaking(true);
    }
  };

  const desc = typeof card.desc === "string" ? card.desc : (card.desc as { en: string }).en;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d0f",
      color: "#f0ebe0",
      fontFamily: "'Georgia', serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Nav */}
      <nav style={{
        padding: "20px 32px",
        borderBottom: "1px solid #252528",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <a href="/" style={{ color: "#c49040", fontSize: "18px", textDecoration: "none", letterSpacing: "0.08em" }}>
          Mayan Oracle
        </a>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Deck selector */}
          <select
            value={deck}
            onChange={(e) => { setDeck(e.target.value as Deck); setIndex(0); }}
            style={{
              background: "#141416",
              border: "1px solid #252528",
              color: "#f0ebe0",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "13px",
              fontFamily: "inherit",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="tulum">Tulum Oracle</option>
            <option value="mayan">Mayan Oracle</option>
          </select>
          <a href="/" style={{ color: "#6e6e6e", fontSize: "14px", textDecoration: "none", marginLeft: "8px" }}>
            Get a reading →
          </a>
        </div>
      </nav>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "0",
        borderBottom: "1px solid #252528",
        flexShrink: 0,
      }}>
        {(["gallery", "oracle"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "none",
              border: "none",
              borderBottom: tab === t ? "2px solid #c49040" : "2px solid transparent",
              color: tab === t ? "#c49040" : "#6e6e6e",
              padding: "14px 24px",
              fontSize: "14px",
              fontFamily: "inherit",
              cursor: "pointer",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {t === "gallery" ? "Cards" : "Oracle Reading"}
          </button>
        ))}
      </div>

      {tab === "gallery" ? (
        /* ── Gallery tab ── */
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Card image — left side, portrait */}
          <div style={{
            flex: "0 0 auto",
            width: "clamp(220px, 35vw, 420px)",
            background: "#0a0a0c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 24px",
            position: "relative",
          }}>
            {/* Prev arrow */}
            <button
              onClick={prev}
              aria-label="Previous card"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(20,20,22,0.8)",
                border: "1px solid #252528",
                color: "#c49040",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ‹
            </button>

            <img
              key={card.id}
              src={card.img}
              alt={card.name}
              style={{
                maxHeight: "calc(100vh - 160px)",
                maxWidth: "100%",
                borderRadius: "12px",
                boxShadow: "0 16px 64px rgba(0,0,0,0.8)",
                display: "block",
              }}
            />

            {/* Next arrow */}
            <button
              onClick={next}
              aria-label="Next card"
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(20,20,22,0.8)",
                border: "1px solid #252528",
                color: "#c49040",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ›
            </button>
          </div>

          {/* Card details — right side */}
          <div style={{
            flex: 1,
            padding: "clamp(32px, 5vw, 64px)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}>
            <p style={{ color: "#c49040", fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "12px" }}>
              {card.id.toUpperCase()} · {index + 1} of {cards.length}
            </p>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: "300", lineHeight: 1.15, marginBottom: "8px" }}>
              {card.name}
            </h1>
            <p style={{ color: "#6e6e6e", fontSize: "18px", fontStyle: "italic", marginBottom: "32px" }}>
              {card.subtitle}
            </p>

            {/* Listen button */}
            <button
              onClick={listen}
              disabled={audioLoading}
              style={{
                alignSelf: "flex-start",
                background: audioLoading ? "#1a1a1d" : speaking ? "#252528" : "#c49040",
                color: speaking || audioLoading ? "#c49040" : "#0d0d0f",
                border: speaking || audioLoading ? "1px solid #c49040" : "none",
                borderRadius: "6px",
                padding: "12px 24px",
                fontSize: "15px",
                fontFamily: "inherit",
                cursor: audioLoading ? "not-allowed" : "pointer",
                letterSpacing: "0.04em",
                marginBottom: "32px",
              }}
            >
              {audioLoading ? "Loading..." : speaking ? "⏸ Stop" : "▶ Listen"}
            </button>

            {/* Keywords */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" }}>
              {card.keywords.map((kw) => (
                <span key={kw} style={{
                  background: "#1a1a1d",
                  border: "1px solid #252528",
                  borderRadius: "4px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  color: "#c49040",
                  letterSpacing: "0.06em",
                }}>
                  {kw}
                </span>
              ))}
            </div>

            {/* Description */}
            <p style={{ color: "#f0ebe0", fontSize: "17px", lineHeight: 1.75, maxWidth: "540px" }}>
              {desc}
            </p>

            {/* Nav dots */}
            <div style={{ display: "flex", gap: "4px", marginTop: "40px" }}>
              {Array.from({ length: Math.min(cards.length, 12) }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: i === index % 12 ? "#c49040" : "#252528",
                  }}
                />
              ))}
              {cards.length > 12 && (
                <span style={{ color: "#6e6e6e", fontSize: "11px", marginLeft: "8px" }}>
                  {index + 1}/{cards.length}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── Oracle tab ── */
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 24px",
          textAlign: "center",
        }}>
          <div style={{ maxWidth: "480px" }}>
            <p style={{ color: "#c49040", fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "16px" }}>
              Personal Oracle Reading
            </p>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: "300", lineHeight: 1.2, marginBottom: "16px" }}>
              Get your reading
            </h2>
            <p style={{ color: "#6e6e6e", fontSize: "16px", marginBottom: "40px" }}>
              Four cards drawn for you. A personal oracle reading narrated in audio.
            </p>
            <a
              href="/"
              style={{
                display: "inline-block",
                background: "#c49040",
                color: "#0d0d0f",
                borderRadius: "8px",
                padding: "18px 48px",
                fontSize: "18px",
                textDecoration: "none",
                fontWeight: "700",
                letterSpacing: "0.04em",
              }}
            >
              Get your reading — $4.99
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0d0d0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#6e6e6e", fontFamily: "Georgia, serif" }}>Loading...</p>
      </div>
    }>
      <GalleryContent />
    </Suspense>
  );
}
