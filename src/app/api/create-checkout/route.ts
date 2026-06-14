import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { cardIds, question, deckId } = await req.json();

    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      return NextResponse.json({ error: "No cards provided" }, { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Oracle Reading",
              description: "A personalized 4-card oracle reading with audio narration",
            },
            unit_amount: 499, // $4.99 — change here to update price everywhere
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/reading?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}`,
      metadata: {
        cardIds: cardIds.join(","),
        question: (question || "").slice(0, 500), // Stripe metadata limit
        deckId: deckId || "tulum",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
