import { TULUM_CARDS } from "@/data/tulum-cards";
import { MAYAN_CARDS } from "@/data/mayan-cards";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const cardIds = id.split("-").filter(Boolean);

  const allCards = [...TULUM_CARDS, ...MAYAN_CARDS];
  const cards = cardIds
    .map((cid) => allCards.find((c) => c.id === cid))
    .filter(Boolean) as typeof TULUM_CARDS;

  const deckName = cardIds.some((cid) => cid.startsWith("t")) ? "Tulum Oracle" : "Mayan Oracle";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d0f",
      color: "#f0ebe0",
      fontFamily: "'Georgia', serif",
    }}>
      {/* Nav */}
      <nav style={{
        padding: "20px 32px",
        borderBottom: "1px solid #252528",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <Link href="/" style={{ color: "#c49040", fontSize: "18px", textDecoration: "none", letterSpacing: "0.08em" }}>
          Mayan Oracle
        </Link>
        <Link href="/gallery" style={{ color: "#6e6e6e", fontSize: "14px", textDecoration: "none" }}>
          Study the Cards
        </Link>
      </nav>

      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
        <p style={{ color: "#c49040", fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "16px" }}>
          {deckName}
        </p>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: "300", lineHeight: 1.2, marginBottom: "16px" }}>
          Someone shared their reading with you
        </h1>
        <p style={{ color: "#6e6e6e", fontSize: "16px", marginBottom: "48px" }}>
          These {cards.length} cards were drawn for them. What would yours reveal?
        </p>

        {/* Cards */}
        {cards.length > 0 && (
          <div style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginBottom: "48px",
            flexWrap: "wrap",
          }}>
            {cards.map((card) => (
              <div key={card.id} style={{ width: "clamp(80px, 18vw, 130px)", textAlign: "center" }}>
                <div style={{
                  borderRadius: "8px",
                  overflow: "hidden",
                  marginBottom: "8px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
                }}>
                  <img
                    src={card.img}
                    alt={card.name}
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
                <p style={{ fontSize: "11px", color: "#c49040", letterSpacing: "0.06em" }}>{card.name}</p>
                <p style={{ fontSize: "10px", color: "#6e6e6e" }}>{card.subtitle}</p>
              </div>
            ))}
          </div>
        )}

        {/* Hero CTA */}
        <div style={{
          background: "#141416",
          border: "1px solid #252528",
          borderRadius: "16px",
          padding: "clamp(32px, 5vw, 48px)",
          marginBottom: "32px",
        }}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: "300", marginBottom: "12px" }}>
            Get your reading
          </h2>
          <p style={{ color: "#6e6e6e", fontSize: "15px", marginBottom: "32px" }}>
            Four cards drawn just for you. A personal oracle reading with audio narration.
          </p>
          <Link
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
          </Link>
        </div>

        <p style={{ color: "#6e6e6e", fontSize: "13px" }}>
          Personalized · Audio narrated · Shareable
        </p>

        {/* Card teaser descriptions */}
        {cards.length > 0 && (
          <div style={{ marginTop: "64px", textAlign: "left" }}>
            <p style={{ color: "#c49040", fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "24px", textAlign: "center" }}>
              Cards in this reading
            </p>
            {cards.map((card) => (
              <div key={card.id} style={{
                background: "#141416",
                border: "1px solid #252528",
                borderRadius: "8px",
                padding: "20px 24px",
                marginBottom: "12px",
              }}>
                <p style={{ color: "#c49040", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                  {card.name} · <span style={{ fontWeight: "400", color: "#6e6e6e" }}>{card.subtitle}</span>
                </p>
                <p style={{ color: "#f0ebe0", fontSize: "14px", lineHeight: 1.6 }}>
                  {card.desc.length > 120 ? card.desc.slice(0, 120) + "..." : card.desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer style={{
        padding: "32px",
        borderTop: "1px solid #252528",
        textAlign: "center",
      }}>
        <Link href="/" style={{ color: "#c49040", fontSize: "15px", textDecoration: "none", letterSpacing: "0.06em" }}>
          Get your reading →
        </Link>
      </footer>
    </div>
  );
}
