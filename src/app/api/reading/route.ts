import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const { question, cards, positions, lang, deckName } = await req.json();

    if (!Array.isArray(cards) || cards.length === 0 || !Array.isArray(positions)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const es = lang === "es";
    const client = new Anthropic();

    const cardDescriptions = cards
      .map((card: { name: string; subtitle: string; keywords: string | string[]; desc: string }, i: number) => {
        const keywords = Array.isArray(card.keywords) ? card.keywords.join(", ") : card.keywords;
        return `${positions[i]}: ${card.name} (${card.subtitle})\nKeywords: ${keywords}\nMessage: "${card.desc}"`;
      })
      .join("\n\n");

    const deck = deckName || "Oracle";
    const questionText = question?.trim() || (es ? "Sin pregunta específica — lectura abierta." : "No specific question — an open reading.");

    const system = es
      ? `Eres un oráculo sabio y directo — no complaciente, sino genuinamente perspicaz y cálido. Das lecturas del ${deck}.
Tus lecturas son poéticas pero fundamentadas, hablando directamente al consultante en segunda persona.
No uses viñetas ni encabezados. Escribe en prosa continua y fluida. Responde siempre en español.`
      : `You are a wise, direct oracle reader — not soft, not flattering, but genuinely insightful and warm. You give readings from the ${deck}.
Your readings are poetic yet grounded, speaking directly to the seeker in second person.
Do not use bullet points or headers. Write in flowing, continuous prose.`;

    const userPrompt = es
      ? `El consultante pregunta: "${questionText}"\n\nSe sacaron ${cards.length} carta(s):\n\n${cardDescriptions}\n\nDa una lectura fluida de 3-5 párrafos que entreteja todas las cartas en un mensaje unificado.`
      : `The seeker asks: "${questionText}"\n\nThey drew ${cards.length} card(s):\n\n${cardDescriptions}\n\nGive a flowing 3-5 paragraph reading that weaves all cards into one unified message.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: userPrompt }],
    });

    const reading = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ reading });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
