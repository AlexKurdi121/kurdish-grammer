import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// --- Load 10 API Keys ---
const API_KEYS = [
  process.env.NEXT_PUBLIC_GEMINI_API_KEY1!,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY2!,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY3!,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY4!,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY5!,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY6!,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY7!,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY8!,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY9!,
  process.env.NEXT_PUBLIC_GEMINI_API_KEY10!,
];

// --- Global Round Robin Index ---
let lastUsedIndex = -1;

// --- Get Next Key ---
function getNextKey() {
  lastUsedIndex = (lastUsedIndex + 1) % API_KEYS.length;
  return {
    apiKey: API_KEYS[lastUsedIndex],
    index: lastUsedIndex,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { text, language } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    // 🔁 Rotate API Key
    const { apiKey, index } = getNextKey();
    console.log(`Using Grammar API key #${index + 1}`);

    const client = new GoogleGenAI({ apiKey });

    const prompt =
      language === "ku"
        ? `
        You are a Kurdish Sorani grammar assistant.

        1. Detect wrong words.
        2. Provide full corrected text.

        Return ONLY JSON:
        {
          "wrong": ["word1","word2"],
          "corrected": "full corrected text"
        }

        Text:
        "${text}"
        `
        : `
        You are an English grammar assistant.

        1. Detect wrong words.
        2. Provide full corrected text.

        Return ONLY JSON:
        {
          "wrong": ["word1","word2"],
          "corrected": "full corrected text"
        }

        Text:
        "${text}"
        `;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    const raw = response.text || "";

    // Extract JSON safely
    const jsonMatch = raw.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Invalid AI response format" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      wrong: parsed.wrong || [],
      corrected: parsed.corrected || text,
      keyIndex: index, // optional (for debugging)
    });

  } catch (error: any) {
    console.error("GEMINI GRAMMAR ERROR:", error);

    // Optional: handle quota error
    if (error?.status === 429) {
      return NextResponse.json(
        { error: "Quota exceeded" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
