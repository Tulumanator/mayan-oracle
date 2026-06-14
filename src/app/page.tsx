"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MAYAN_CARDS, type MayanCard } from "@/data/mayan-cards";

const MAX_PICKS = 4;
const POSITIONS = ["Past", "Present", "Future", "Guidance"];

const COLLAGE = [
  { src: "/cards/cenotes.jpg",         x: -6,  y: -5,  rot: -5,  w: 380, h: 540 },
  { src: "/cards/chak.jpg",            x: 20,  y: -8,  rot: 3,   w: 340, h: 480 },
  { src: "/cards/palenque.jpg",        x: 55,  y: -6,  rot: -4,  w: 360, h: 510 },
  { src: "/cards/cacao.jpg",           x: 82,  y: -5,  rot: 6,   w: 380, h: 540 },
  { src: "/cards/selva.jpg",           x: -5,  y: 50,  rot: 7,   w: 360, h: 510 },
  { src: "/cards/volcan.jpg",          x: 22,  y: 55,  rot: -3,  w: 340, h: 480 },
  { src: "/cards/ah-muzen-cab.jpg",    x: 55,  y: 52,  rot: 4,   w: 350, h: 495 },
  { src: "/cards/bacabs.jpg",          x: 82,  y: 50,  rot: -6,  w: 360, h: 510 },
];

// ── Card slot (top row) ────────────────────────────────────────────────────
function CardSlot({ card, index, flipped, onClick }: {
  card: MayanCard | null;
  index: number;
  flipped: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <p style={{
        fontSize: "10px",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: card ? "rgba(196,144,64,0.7)" : "rgba(196,144,64,0.25)",
        transition: "color 0.3s",
      }}>
        {POSITIONS[index]}
      </p>
      <div
        onClick={card ? onClick : undefined}
        onMouseEnter={() => card && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: "clamp(160px, 24vw, 260px)",
          height: "clamp(256px, 38.4vw, 416px)",
          perspective: "800px",
          cursor: card ? "pointer" : "default",
        }}
      >
        <div style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}>
          {/* Back face */}
          <div style={{
            position: "absolute", inset: 0,
            backfaceVisibility: "hidden",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}>
            <img
              src="/cards/card-back.png"
              alt="Card back"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>

          {/* Front face (artwork) */}
          <div style={{
            position: "absolute", inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: hovered
              ? "0 16px 50px rgba(196,144,64,0.4), 0 0 0 2px rgba(196,144,64,0.5)"
              : "0 8px 36px rgba(0,0,0,0.7)",
            transition: "box-shadow 0.2s ease",
          }}>
            {card && (
              <>
                <img src={card.img} alt={card.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                {hovered && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "rgba(196,144,64,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: "22px", filter: "drop-shadow(0 0 8px #c49040)" }}>🔍</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Card name below slot */}
      {card && (
        <p style={{
          fontSize: "11px",
          color: "rgba(240,235,224,0.7)",
          textAlign: "center",
          maxWidth: "clamp(160px, 24vw, 260px)",
          lineHeight: 1.3,
          fontWeight: "600",
        }}>
          {card.name}
        </p>
      )}

      {/* Empty slot placeholder */}
      {!card && (
        <div style={{
          width: "clamp(160px, 24vw, 260px)",
          height: "clamp(256px, 38.4vw, 416px)",
          borderRadius: "10px",
          border: "1.5px dashed rgba(196,144,64,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "absolute",
          top: "28px",
        }}>
          <span style={{ fontSize: "22px", color: "rgba(196,144,64,0.1)" }}>+</span>
        </div>
      )}
    </div>
  );
}

// ── Face-down card in the spread ───────────────────────────────────────────
function SpreadCard({ selected, onClick, index, disabled }: {
  selected: boolean; onClick: () => void; index: number; disabled: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const wobble = Math.sin(index * 0.7) * 1.5;

  return (
    <div
      onClick={!disabled || selected ? onClick : undefined}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "54px", height: "86px",
        borderRadius: "7px",
        cursor: disabled && !selected ? "not-allowed" : "pointer",
        flexShrink: 0,
        position: "relative",
        transition: "transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s ease, opacity 0.3s",
        opacity: disabled && !selected ? 0.35 : 1,
        transform: selected
          ? "translateY(-16px) scale(1.1)"
          : hovered && !disabled
          ? "translateY(-8px) scale(1.06)"
          : `translateY(${wobble}px) rotate(${wobble * 0.35}deg)`,
        boxShadow: selected
          ? "0 16px 40px rgba(196,144,64,0.5), 0 0 0 2px #c49040"
          : hovered && !disabled
          ? "0 12px 28px rgba(0,0,0,0.6), 0 0 14px rgba(244,162,97,0.3)"
          : "0 4px 14px rgba(0,0,0,0.55)",
        overflow: "hidden",
      }}
    >
      <img
        src="/cards/card-back.png"
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", userSelect: "none" }}
      />
      {/* Hover / selected tint overlay */}
      {(selected || (hovered && !disabled)) && (
        <div style={{
          position: "absolute", inset: 0,
          background: selected
            ? "rgba(196,144,64,0.18)"
            : "rgba(244,162,97,0.12)",
          borderRadius: "7px",
        }} />
      )}
      {selected && (
        <div style={{
          position: "absolute", top: "3px", right: "3px",
          width: "14px", height: "14px", borderRadius: "50%",
          background: "linear-gradient(135deg, #c49040, #e8a020)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "7px", color: "#000", fontWeight: "900",
          boxShadow: "0 0 8px rgba(196,144,64,0.7)",
        }}>✓</div>
      )}
    </div>
  );
}

// ── Card detail modal ──────────────────────────────────────────────────────
function CardModal({ card, onClose }: { card: MayanCard; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(8,4,2,0.92)",
        backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          gap: "0",
          maxWidth: "800px",
          width: "100%",
          maxHeight: "92vh",
          overflow: "auto",
          animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            alignSelf: "flex-end",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#f0ebe0",
            borderRadius: "50%",
            width: "40px", height: "40px",
            fontSize: "18px",
            cursor: "pointer",
            fontFamily: "inherit",
            marginBottom: "16px",
            flexShrink: 0,
          }}
        >✕</button>

        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(180px, 280px) 1fr",
          gap: "clamp(20px, 4vw, 48px)",
          background: "rgba(20,12,6,0.95)",
          border: "1px solid rgba(196,144,64,0.18)",
          borderRadius: "20px",
          padding: "clamp(24px, 4vw, 48px)",
          width: "100%",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(6,214,160,0.08)",
        }}>
          {/* Big card image */}
          <div style={{ borderRadius: "12px", overflow: "hidden", boxShadow: "0 12px 50px rgba(0,0,0,0.8)", flexShrink: 0 }}>
            <img src={card.img} alt={card.name} style={{ width: "100%", display: "block" }} />
          </div>

          {/* Text content */}
          <div>
            <p style={{ fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#c49040", marginBottom: "10px" }}>
              Mayan Oracle
            </p>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: "300", lineHeight: 1.15, marginBottom: "6px" }}>
              {card.name}
            </h2>
            <p style={{ color: "rgba(210,180,130,0.55)", fontSize: "15px", fontStyle: "italic", marginBottom: "24px" }}>
              {card.subtitle}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "24px" }}>
              {card.keywords.map((kw) => (
                <span key={kw} style={{
                  background: "rgba(196,144,64,0.1)",
                  border: "1px solid rgba(196,144,64,0.25)",
                  borderRadius: "4px",
                  padding: "3px 10px",
                  fontSize: "11px",
                  color: "#c49040",
                  letterSpacing: "0.07em",
                }}>{kw}</span>
              ))}
            </div>

            <div style={{ height: "1px", background: "rgba(196,144,64,0.1)", marginBottom: "20px" }} />

            <p style={{ color: "rgba(240,235,224,0.82)", fontSize: "clamp(14px, 1.5vw, 16px)", lineHeight: 1.8 }}>
              {card.desc}
            </p>

            <button
              onClick={onClose}
              style={{
                marginTop: "28px",
                background: "linear-gradient(135deg, #c49040, #e8a020)",
                color: "#0c0804",
                border: "none",
                borderRadius: "8px",
                padding: "12px 28px",
                fontSize: "14px",
                fontFamily: "inherit",
                fontWeight: "700",
                cursor: "pointer",
                letterSpacing: "0.06em",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  // ordered array so we track which slot each pick goes in
  const [picks, setPicks] = useState<(MayanCard | null)[]>([null, null, null, null]);
  const [flipped, setFlipped] = useState<boolean[]>([false, false, false, false]);
  const [modalCard, setModalCard] = useState<MayanCard | null>(null);
  const [shaking, setShaking] = useState(false);

  const cards = useMemo(() => [...MAYAN_CARDS].sort(() => Math.random() - 0.5), []);

  const pickedIds = useMemo(() => new Set(picks.filter(Boolean).map((c) => c!.id)), [picks]);
  const filledCount = picks.filter(Boolean).length;
  const ready = filledCount === MAX_PICKS;

  const toggle = (card: MayanCard) => {
    if (pickedIds.has(card.id)) {
      // Remove it — find which slot and clear it, also un-flip
      const idx = picks.findIndex((c) => c?.id === card.id);
      if (idx === -1) return;
      setPicks((prev) => { const next = [...prev]; next[idx] = null; return next; });
      setFlipped((prev) => { const next = [...prev]; next[idx] = false; return next; });
    } else {
      const nextSlot = picks.findIndex((c) => c === null);
      if (nextSlot === -1) {
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
        return;
      }
      setPicks((prev) => { const next = [...prev]; next[nextSlot] = card; return next; });
      // Flip with a small delay so the card "lands" first
      setTimeout(() => {
        setFlipped((prev) => { const next = [...prev]; next[nextSlot] = true; return next; });
      }, 80);
    }
  };

  const handleGetReading = () => {
    if (!ready) return;
    const ids = picks.filter(Boolean).map((c) => c!.id).join(",");
    const q = question.trim() ? `&q=${encodeURIComponent(question)}` : "";
    router.push(`/reading?cards=${ids}${q}&deck=mayan`);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0c0804",
      color: "#f0ebe0",
      fontFamily: "'Georgia', serif",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 24px rgba(196,144,64,0.4)} 50%{box-shadow:0 0 44px rgba(196,144,64,0.75)} }
        @keyframes float { 0%,100%{transform:translateY(0px) scale(1)} 50%{transform:translateY(-8px) scale(1.01)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        input::placeholder { color: rgba(230,200,140,0.35); }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Collage background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        {COLLAGE.map((item, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${item.x}%`, top: `${item.y}%`,
            width: `${item.w}px`, height: `${item.h}px`,
            backgroundImage: `url(${item.src})`,
            backgroundSize: "cover", backgroundPosition: "center",
            borderRadius: "10px",
            transform: `rotate(${item.rot}deg)`,
            opacity: 0.72,
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            filter: "saturate(1.3) brightness(0.9)",
            animation: `float ${6 + i * 0.7}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }} />
        ))}
        {/* Light vignette — just enough to keep text readable */}
        <div style={{
          position: "absolute", inset: 0,
          background: `
            linear-gradient(to bottom, rgba(12,8,4,0.55) 0%, rgba(12,8,4,0.1) 20%, rgba(12,8,4,0.1) 80%, rgba(12,8,4,0.6) 100%),
            radial-gradient(ellipse 60% 50% at 50% 40%, rgba(12,8,4,0.45) 0%, transparent 100%)
          `,
        }} />
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* Nav */}
        <nav style={{ padding: "18px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            fontSize: "22px", fontWeight: "700", letterSpacing: "0.05em",
            background: "linear-gradient(90deg, #c49040 0%, #e8a020 40%, #8b4513 80%, #c49040 100%)",
            backgroundSize: "250% auto",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            animation: "shimmer 5s linear infinite",
          }}>Mayan Oracle</span>
          <a href="/gallery" style={{ color: "rgba(230,200,140,0.4)", fontSize: "13px", textDecoration: "none", letterSpacing: "0.07em" }}>
            Study the Cards →
          </a>
        </nav>

        {/* Hero */}
        <div style={{ textAlign: "center", padding: "20px 24px 16px" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(196,144,64,0.1)", border: "1px solid rgba(196,144,64,0.3)",
            borderRadius: "20px", padding: "5px 18px",
            fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#c49040",
            marginBottom: "16px",
          }}>
            70 cards · choose 4 · free reading
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 60px)", fontWeight: "300", lineHeight: 1.1, marginBottom: "12px", letterSpacing: "-0.02em" }}>
            What does the Mayan Oracle{" "}
            <em style={{ background: "linear-gradient(135deg, #c49040, #e8a020 40%, #8b4513)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontStyle: "italic" }}>
              have for you?
            </em>
          </h1>
          <p style={{ color: "rgba(245,235,210,0.9)", fontSize: "clamp(17px, 2vw, 22px)", maxWidth: "520px", margin: "0 auto 28px", lineHeight: 1.55, fontWeight: "400", textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>
            Choose the four cards that call to you. Then ask for your reading.
          </p>

          {/* Question bar */}
          <div style={{
            maxWidth: "760px", margin: "0 auto",
            display: "flex",
            background: "rgba(24,14,8,0.92)",
            border: ready ? "2px solid rgba(196,144,64,0.7)" : "2px solid rgba(196,144,64,0.45)",
            borderRadius: "14px", overflow: "hidden",
            backdropFilter: "blur(20px)",
            transition: "border-color 0.3s, box-shadow 0.3s",
            boxShadow: ready
              ? "0 0 40px rgba(196,144,64,0.25), 0 8px 32px rgba(0,0,0,0.6)"
              : "0 0 24px rgba(196,144,64,0.15), 0 8px 32px rgba(0,0,0,0.6)",
            animation: shaking ? "shake 0.45s ease" : "none",
          }}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGetReading()}
              placeholder="Your question... (optional)"
              maxLength={300}
              style={{
                flex: 1, background: "none", border: "none",
                color: "#f0ebe0", fontSize: "20px", padding: "20px 24px",
                fontFamily: "inherit", outline: "none", minWidth: 0,
              }}
            />
            <button
              onClick={handleGetReading}
              disabled={!ready}
              style={{
                background: ready ? "linear-gradient(135deg, #c49040, #e8a020)" : "rgba(255,255,255,0.04)",
                color: ready ? "#0c0804" : "rgba(110,180,140,0.35)",
                border: "none", padding: "20px 32px",
                fontSize: "16px", fontFamily: "inherit", fontWeight: "800",
                cursor: ready ? "pointer" : "not-allowed",
                transition: "all 0.25s ease", letterSpacing: "0.07em", whiteSpace: "nowrap",
                animation: ready ? "pulse-glow 2s ease-in-out infinite" : "none",
              }}
            >
              {ready ? "Get My Reading ✦" : `${MAX_PICKS - filledCount} to go`}
            </button>
          </div>
        </div>

        {/* ── CHOSEN CARDS ROW ─────────────────────────── */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "clamp(12px, 3vw, 32px)",
          padding: "16px 24px 12px",
        }}>
          {picks.map((card, i) => (
            <CardSlot
              key={i}
              card={card}
              index={i}
              flipped={flipped[i]}
              onClick={() => card && setModalCard(card)}
            />
          ))}
        </div>

        {/* Status line */}
        <p style={{
          textAlign: "center", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
          color: ready ? "#c49040" : "rgba(196,144,64,0.35)",
          margin: "4px 0 8px", transition: "color 0.3s",
        }}>
          {ready
            ? "✦ Tap a card to explore it, or get your reading ✦"
            : filledCount === 0
            ? "Choose four cards from the spread below"
            : `${filledCount} of ${MAX_PICKS} chosen — ${MAX_PICKS - filledCount} more`}
        </p>

        {/* ── CARD SPREAD ───────────────────────────────── */}
        <div style={{ flex: 1, padding: "4px 12px 20px", overflowX: "auto" }}>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "7px",
            justifyContent: "center",
            maxWidth: "1100px", margin: "0 auto",
            padding: "8px 0 10px",
          }}>
            {cards.map((card, i) => (
              <SpreadCard
                key={card.id}
                selected={pickedIds.has(card.id)}
                onClick={() => toggle(card)}
                index={i}
                disabled={ready && !pickedIds.has(card.id)}
              />
            ))}
          </div>
        </div>

        <footer style={{ padding: "12px 32px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "center", gap: "32px" }}>
          <a href="/gallery" style={{ color: "rgba(196,144,64,0.22)", fontSize: "12px", textDecoration: "none" }}>Gallery</a>
          <a href="/gallery?tab=oracle" style={{ color: "rgba(196,144,64,0.22)", fontSize: "12px", textDecoration: "none" }}>Oracle</a>
        </footer>
      </div>

      {/* ── MODAL ─────────────────────────────────────── */}
      {modalCard && (
        <CardModal card={modalCard} onClose={() => setModalCard(null)} />
      )}
    </div>
  );
}
