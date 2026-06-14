import Stripe from "stripe";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { TULUM_CARDS } from "@/data/tulum-cards";

// Mayan card IDs start with "m", Tulum with "t"
const MAYAN_IDS_MAP: Record<string, { name: string; subtitle: string; keywords: string[]; desc: string }> = {};

// We load Mayan cards lazily to avoid circular imports
async function getCardById(id: string) {
  if (id.startsWith("t")) {
    return TULUM_CARDS.find((c) => c.id === id) || null;
  }
  // For Mayan cards, dynamically import to keep this route lean
  const { MAYAN_CARDS } = await import("@/data/mayan-cards");
  return MAYAN_CARDS.find((c) => c.id === id) || null;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const anthropic = new Anthropic();
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "No session ID" }, { status: 400 });
    }

    // Verify payment with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }

    const { cardIds, question, deckId } = session.metadata || {};
    const cardIdArray = (cardIds || "").split(",").filter(Boolean);

    // Look up card objects
    const cards = (await Promise.all(cardIdArray.map(getCardById))).filter(Boolean) as {
      id: string; name: string; subtitle: string; keywords: string[]; desc: string; img: string;
    }[];

    if (cards.length === 0) {
      return NextResponse.json({ error: "Cards not found" }, { status: 404 });
    }

    const deckName = deckId === "tulum" ? "Tulum Oracle" : "Mayan Oracle";
    const questionText = question?.trim() || "No specific question — an open reading.";
    const positions = ["Past", "Present", "Future", "Guidance"].slice(0, cards.length);

    const cardDescriptions = cards
      .map((card, i) => `${positions[i]}: ${card.name} (${card.subtitle})\nKeywords: ${card.keywords.join(", ")}\nMessage: "${card.desc}"`)
      .join("\n\n");

    // Generate oracle reading with Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are a wise, direct oracle reader — not soft, not flattering, but genuinely insightful and warm. You give readings from the ${deckName}.
Your readings are poetic yet grounded, speaking directly to the seeker in second person.
Do not use bullet points or headers. Write in flowing, continuous prose. Keep the reading to 3-4 paragraphs — rich but not exhausting.
This reading will be narrated as audio, so write naturally — no markdown, no asterisks, no special formatting.`,
      messages: [
        {
          role: "user",
          content: `The seeker asks: "${questionText}"\n\nThey drew ${cards.length} cards:\n\n${cardDescriptions}\n\nGive a flowing 3-4 paragraph reading that weaves all cards into one unified message. Write for audio narration.`,
        },
      ],
    });

    const reading = message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({
      cards,
      reading,
      question: questionText,
      deckName,
      shareId: cardIdArray.join("-"),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
