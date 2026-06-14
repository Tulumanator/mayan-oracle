import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const { pdfBase64 } = await req.json();

    if (!pdfBase64) {
      return NextResponse.json({ error: "No PDF data provided" }, { status: 400 });
    }

    const client = new Anthropic();

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8000,
      messages: [{
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: pdfBase64 }
          },
          {
            type: "text",
            text: `Extract all oracle cards from this guidebook PDF. For each card return a JSON array. Each card object must have exactly these fields:
- id: a short unique slug (e.g. "the-fool", "card-01")
- name: the card's main name
- subtitle: the card's subtitle or archetype description
- keywords: array of 3-5 keyword strings
- desc: the card's full description text as a single string (the main body of the card's message)

Return ONLY a valid JSON array, no markdown, no explanation, no code fences. Start with [ and end with ].`
          }
        ]
      }]
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map(b => b.text)
      .join("");

    const cleaned = text.replace(/```json|```/g, "").trim();
    const cards = JSON.parse(cleaned);

    return NextResponse.json({ cards });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
