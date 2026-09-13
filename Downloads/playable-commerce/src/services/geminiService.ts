// src/services/geminiService.ts
import { GoogleGenAI } from '@google/genai';
import type { BrandProfile, Concept, GameSpec } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
const MODEL = 'gemini-2.5-flash';

export async function analyzeBrand(url: string): Promise<BrandProfile> {
  const prompt = `You are a creative director and game designer analyzing an ecommerce product URL to find what is inherently playable about it.

Analyze this URL: ${url}

Extract the following and return ONLY valid JSON matching this exact schema:
{
  "brandName": "string — the brand name",
  "productName": "string — the hero product name",
  "category": "string — product category (e.g. bags, beverages, footwear)",
  "primaryColor": "string — hex color code representing the brand's primary color",
  "backgroundColor": "string — hex color code for a suitable game background",
  "accentColor": "string — hex color code for accent/highlight",
  "tone": "string — brand personality in one word (e.g. cybersecurity, playful, premium, athletic)",
  "usp": "string — the single most compelling unique selling point",
  "targetCustomer": "string — who buys this product",
  "playableAttributes": [
    { "label": "string — attribute name", "reason": "string — why this is gameable" }
  ],
  "interactionMetaphors": ["string — action metaphor e.g. 'crack the lock', 'stop the pour'"]
}

Rules:
- playableAttributes: list 3-5 concrete physical or conceptual features that could become game mechanics
- interactionMetaphors: list 4-6 brand-specific action phrases — NOT generic (no 'spin the wheel', no 'scratch card')
- If the URL is unreachable, infer from the domain name and any path segments
- primaryColor, backgroundColor, accentColor must be valid hex codes`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  const text = response.text ?? '';
  return JSON.parse(text) as BrandProfile;
}

export async function generateConcepts(brandProfile: BrandProfile): Promise<Concept[]> {
  const primitiveDocs = `
Available primitives and skins:
- precision_stop: stop a moving value at a target. Skins: stopwatch, ruler, fuel_gauge, pour_drink, countdown_bar
- multi_dial: set N dials/wheels to unlock. Skins: combination_lock, slot_reels, safe_dial
- pick_one: choose one from N mystery options. Skins: mystery_box, card_flip, capsule_machine
- hold_release: hold to charge, release at peak. Skins: strength_meter, tension_bow
- reaction: tap when visual signal fires. Skins: flash_tap, catch_object
- drag_target: drag items to destinations. Skins: pack_bag, sort_items
- fill_meter: fill to exact target level. Skins: charge_bar, stack_coins
`;

  const prompt = `You are a creative director and game designer generating brand-specific gamified conversion experiences.

Brand profile:
${JSON.stringify(brandProfile, null, 2)}

${primitiveDocs}

Generate exactly 3 game concepts. Each must be deeply tied to this specific product — NOT generic.
The test: "If the brand logo disappeared, could someone guess the brand from the game alone?" Answer must be YES.

Return ONLY valid JSON: an array of 3 concept objects matching this exact schema:
[
  {
    "id": "string — snake_case unique id",
    "name": "string — game name (2-4 words, dramatic)",
    "premise": "string — one sentence describing the game",
    "whyItFits": "string — why this mechanic represents the product specifically",
    "primitive": "string — one of: precision_stop, multi_dial, pick_one, hold_release, reaction, drag_target, fill_meter",
    "skin": "string — skin name from the available list above",
    "skinDescription": "string — how the skin should look using this brand's aesthetic",
    "headline": "string — the in-game headline shown to the visitor (max 5 words, ALL CAPS)",
    "ctaText": "string — start button text (2-3 words, ALL CAPS)",
    "resultHeadline": "string — the result moment headline (max 3 words, dramatic)",
    "rewardMessage": "string — the reward reveal copy (full sentence)",
    "scores": {
      "brandSpecificity": number 1-10,
      "productDemonstration": number 1-10,
      "simplicity": number 1-10,
      "suspense": number 1-10,
      "rewardFit": number 1-10,
      "mobileUsability": number 1-10,
      "conversionPotential": number 1-10
    }
  }
]

Rules:
- Each concept must use a DIFFERENT primitive
- No concept may score below 6 on brandSpecificity
- No concept may score below 5 on mobileUsability
- Concepts must vary in tone (e.g. one intense, one playful, one elegant)`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  const text = response.text ?? '';
  return JSON.parse(text) as Concept[];
}

export async function buildGameSpec(concept: Concept, brandProfile: BrandProfile): Promise<GameSpec> {
  const prompt = `You are building a structured GameSpec JSON for a gamified ecommerce conversion experience.

Brand profile:
${JSON.stringify(brandProfile, null, 2)}

Selected concept:
${JSON.stringify(concept, null, 2)}

Return ONLY valid JSON matching this exact schema:
{
  "experience": {
    "name": "string — experience name",
    "goal": "lead_capture",
    "surface": "popup"
  },
  "branding": {
    "primaryColor": "string — hex from brand",
    "backgroundColor": "string — hex, dark works best",
    "textColor": "string — hex, high contrast against backgroundColor",
    "accentColor": "string — hex for highlights",
    "fontStyle": "string — one of: sans, serif, mono, display",
    "tone": "string — e.g. cybersecurity, playful, premium"
  },
  "intro": {
    "headline": "string — 3-5 words ALL CAPS",
    "body": "string — 1-2 sentences enticing play",
    "cta": "string — 2-3 words ALL CAPS"
  },
  "mechanic": {
    "primitive": "${concept.primitive}",
    "skin": "${concept.skin}",
    "config": {
      // For precision_stop/pour_drink: targetValue (0-100), maxValue (100), speed ("medium"), unit ("%"), vessel_shape ("flask")
      // For multi_dial/combination_lock: digits (3), solution ([random 3 digits])
      // For pick_one/mystery_box: count (3), box_labels (["Box A","Box B","Box C"])
      // For hold_release/strength_meter: peak_zone_min (60), peak_zone_max (80), label ("POWER")
      // For reaction/flash_tap: flash_color (hex), window_ms (800)
      // For fill_meter/charge_bar: target_min (55), target_max (75), label ("CHARGE")
    }
  },
  "result": {
    "headline": "string — 2-3 words, dramatic ALL CAPS",
    "body": "string — acknowledge attempt, then reveal reward",
    "delayMs": 1200,
    "type": "deny"
  },
  "reward": {
    "type": "free_shipping",
    "value": "string or omit",
    "message": "string — the full reward reveal sentence"
  },
  "conversion": {
    "provider": "klaviyo",
    "winnerFormId": "",
    "standardFormId": ""
  }
}

Important: fill config with actual values appropriate to the skin. Do not leave placeholder comments.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  const text = response.text ?? '';
  return JSON.parse(text) as GameSpec;
}
