export type DeckId = "mayan" | "tulum";

export interface DeckMeta {
  id: DeckId;
  name: string;
  name_es: string;
  tagline: string;
  tagline_es: string;
  cardCount: number;
  color: string; // accent color for this deck
}

export const DECKS: DeckMeta[] = [
  {
    id: "mayan",
    name: "Mayan Oracle",
    name_es: "Oráculo Maya",
    tagline: "70 cards of ancient Mayan wisdom",
    tagline_es: "70 cartas de sabiduría maya ancestral",
    cardCount: 70,
    color: "#c9a84c",
  },
  {
    id: "tulum",
    name: "Tulum Oracle",
    name_es: "Oráculo de Tulum",
    tagline: "48 cards for seekers, wanderers & the beautifully lost",
    tagline_es: "48 cartas para buscadores, viajeros y los bellamente perdidos",
    cardCount: 48,
    color: "#5a9e8a",
  },
];

export const DEFAULT_DECK: DeckId = "mayan";
