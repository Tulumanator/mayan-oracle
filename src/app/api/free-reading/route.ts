import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { TULUM_CARDS } from "@/data/tulum-cards";

export async function POST(req: NextRequest) {
  try {
    const { cardIds, question, deckId } = await req.json();

    const { MAYAN_CARDS } = await import("@/data/mayan-cards");
    const allCards = [...TULUM_CARDS, ...MAYAN_CARDS];

    const cards = (cardIds as string[])
      .map((id: string) => allCards.find((c) => c.id === id))
      .filter(Boolean) as typeof TULUM_CARDS;

    if (cards.length === 0) {
      return NextResponse.json({ error: "No cards found" }, { status: 400 });
    }

    const deckName = (deckId === "mayan") ? "Mayan Oracle" : "Tulum Oracle";
    const questionText = question?.trim() || "No specific question — an open reading.";
    const positions = ["Past", "Present", "Future", "Guidance"].slice(0, cards.length);

    const cardDescriptions = cards
      .map((card, i) => `${positions[i]}: ${card.name} (${card.subtitle})\nKeywords: ${card.keywords.join(", ")}\nMessage: "${card.desc}"`)
      .join("\n\n");

    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are a vibrant, warm oracle reader who gives readings from the ${deckName}. You speak directly to the seeker in second person. Your voice is poetic, grounded, and alive — not somber, not flattering, but genuinely illuminating. You find the thread of truth that runs through all four cards and weave it into a single story about the seeker's life right now. Write in flowing prose, 3-4 paragraphs. This will be spoken aloud, so write naturally — no markdown, no bullet points, no formatting symbols.`,
      messages: [
        {
          role: "user",
          content: `The seeker asks: "${questionText}"\n\nThey drew ${cards.length} cards:\n\n${cardDescriptions}\n\nGive a flowing 3-4 paragraph reading. Write for audio narration — warm, direct, alive.`,
        },
      ],
    });

    const reading = message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({
      cards,
      reading,
      question: questionText,
      deckName,
      shareId: (cardIds as string[]).join("-"),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
