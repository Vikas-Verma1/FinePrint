import { NextResponse } from "next/server";
import OpenAI from "openai";

const OPENAI_API_KEY = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
const BASE_URL = process.env.GROQ_API_KEY 
  ? "https://api.groq.com/openai/v1" 
  : "https://api.openai.com/v1";
const MODEL = process.env.OPENAI_MODEL || "llama-3.3-70b-versatile";

export async function POST(request) {
  try {
    const { message, conversation } = await request.json();

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 503 }
      );
    }

    const client = new OpenAI({
      apiKey: OPENAI_API_KEY,
      baseURL: BASE_URL
    });

    // Build conversation history for context
    const messages = [
      {
        role: "system",
        content: `You are FinePrint AI, a helpful insurance policy assistant. You help users understand insurance policies, explain complex clauses in simple terms, and answer questions about coverage, exclusions, waiting periods, and claims. Be friendly, clear, and concise. If you don't know something, admit it honestly.`
      },
      ...(conversation || []).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: "user",
        content: message
      }
    ];

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content;

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}