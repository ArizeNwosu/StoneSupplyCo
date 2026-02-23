
import { GoogleGenAI } from '@google/genai';
import { AIGenerationResult, ContentPillar } from "../types";

const SYSTEM_PROMPT = `You are the chief content strategist for the Taurus World Stunt Awards — the most prestigious honor in the global stunt industry. You write viral social media content that treats stunt performers with the reverence of elite athletes and artists.

Your tone is:
- Instagram: Cinematic, prestigious, reverent. Like a high-end sports publication.
- TikTok: Raw, adrenaline-first, hook-heavy. Stop-the-scroll energy.
- Trivia: Technical authority. Industry insider knowledge that builds credibility.`;

const buildPrompt = (stuntTitle: string, pillar: ContentPillar, context: string): string => `
${SYSTEM_PROMPT}

Generate content for this archive clip:
- Title / Archive Reference: "${stuntTitle}"
- Content Pillar: ${pillar}
- Technical Notes: ${context || 'No additional context provided'}

Return ONLY a valid JSON object with exactly these three keys. No markdown formatting, no code fences, no explanation — raw JSON only:

{
  "igCaption": "2-3 sentences of cinematic, prestigious Instagram caption. Treat the performer like a deity of their craft. Close with 6-8 powerful hashtags. Tone: Reverent. Elite. Intense. Make the reader feel the weight of what was risked.",
  "tiktokHook": "Single punchy opening line. Under 120 characters. Lead with the most shocking element — injury, risk, impossibility, or record. No hashtags. No period. Must create immediate pattern interrupt.",
  "trivia": "1-2 sentences of technical behind-the-scenes authority fact. Include specific numbers (takes, speed, height, team size, prep time). Builds industry credibility. Tone: insider knowledge."
}
`;

export class GeminiService {
  private client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    if (!this.client) {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
        throw new Error('GEMINI_API_KEY_MISSING');
      }
      this.client = new GoogleGenAI({ apiKey });
    }
    return this.client;
  }

  async generateContent(
    stuntTitle: string,
    pillar: ContentPillar,
    context: string,
    onChunk?: (rawText: string) => void
  ): Promise<AIGenerationResult> {
    const client = this.getClient();
    const prompt = buildPrompt(stuntTitle, pillar, context);

    const stream = await client.models.generateContentStream({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    let accumulated = '';

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        accumulated += text;
        onChunk?.(accumulated);
      }
    }

    // Strip markdown code fences if Gemini wraps the response
    const cleaned = accumulated
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Extract JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]) as AIGenerationResult;

    if (!parsed.igCaption || !parsed.tiktokHook || !parsed.trivia) {
      throw new Error('AI response missing required fields');
    }

    return parsed;
  }
}

export const geminiService = new GeminiService();
