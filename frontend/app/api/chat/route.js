import { NextResponse } from "next/server";
import OpenAI from "openai";

const OPENAI_API_KEY = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
const IS_GROQ = Boolean(process.env.GROQ_API_KEY);
const BASE_URL = IS_GROQ
  ? "https://api.groq.com/openai/v1"
  : "https://api.openai.com/v1";

const MODEL =
  process.env.OPENAI_MODEL ||
  (IS_GROQ ? "llama-3.3-70b-versatile" : "gpt-4o-mini");

const MAX_POLICY_CHARS = 24000;

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 8000) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const conversation = Array.isArray(body.conversation)
      ? body.conversation
          .filter(
            (m) =>
              m &&
              typeof m.content === "string" &&
              (m.role === "user" || m.role === "assistant")
          )
          .slice(-5)
      : [];

    const pc =
      body.policyContext && typeof body.policyContext === "object"
        ? body.policyContext
        : null;
    const hasPolicy = Boolean(pc && (pc.text || pc.reportJson));

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 503 });
    }

    // ---------- STRICT GROUNDED SYSTEM PROMPT ----------
    let system = `You are FinePrint AI, the user's personal insurance-policy advocate.

GROUNDING RULES — FOLLOW ABSOLUTELY:
1. You have access to EXACTLY ONE policy: the user's own policy, provided below inside <POLICY_DOCUMENT> tags, plus an analysis of it inside <ANALYSIS_REPORT> tags.
2. When the user asks anything about "my policy", "the policy", its coverage, clauses, exclusions, waiting periods, limits, riders or benefits, answer ONLY from the text of THAT document. NEVER use information from other policies or general insurance knowledge.
3. Support every answer with the exact clause text and section number copied from the document (e.g. "§7.2 — ...").
4. If the requested information is NOT present in the document, say so plainly: "Your uploaded policy does not mention <topic>." Do NOT fill the gap with generic explanations of what other policies usually contain. You may add one short suggestion (check the full PDF or paste that section).
5. If NO <POLICY_DOCUMENT> is provided and the user asks about "my policy", do NOT guess. Reply: "You haven't uploaded your policy yet. Open the Read page, upload your policy (or paste its text), and I will answer only from your actual document."
6. Purely educational questions (e.g. "what does sum insured mean?") may get a 1-2 sentence plain definition, then immediately state whether and where it appears in THE USER'S policy.`;

    if (hasPolicy) {
      system += `\n\nThe user's policy file/name: ${String(pc.name || "Uploaded policy").replace(/"/g, "'")}`;

      if (pc.text) {
        const t =
          pc.text.length > MAX_POLICY_CHARS
            ? pc.text.slice(0, MAX_POLICY_CHARS) + "\n[…truncated…]"
            : pc.text;
        system += `\n\n<POLICY_DOCUMENT>\n${t}\n</POLICY_DOCUMENT>`;
      }

      if (pc.reportJson) {
        system += `\n\n<ANALYSIS_REPORT>\n${pc.reportJson}\n</ANALYSIS_REPORT>`;
      }
    }

    const client = new OpenAI({ apiKey: OPENAI_API_KEY, baseURL: BASE_URL });

    const messages = [
      { role: "system", content: system },
      ...conversation.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message }
    ];

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.2, // low = faithful to the document, less invented content
      max_tokens: 700
    });

    return NextResponse.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}













// import { NextResponse } from "next/server";
// import OpenAI from "openai";

// const OPENAI_API_KEY = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
// const BASE_URL = process.env.GROQ_API_KEY 
//   ? "https://api.groq.com/openai/v1" 
//   : "https://api.openai.com/v1";
// const MODEL = process.env.OPENAI_MODEL || "llama-3.3-70b-versatile";

// export async function POST(request) {
//   try {
//     const { message, conversation } = await request.json();

//     if (!OPENAI_API_KEY) {
//       return NextResponse.json(
//         { error: "API key not configured" },
//         { status: 503 }
//       );
//     }

//     const client = new OpenAI({
//       apiKey: OPENAI_API_KEY,
//       baseURL: BASE_URL
//     });

//     // Build conversation history for context
//     const messages = [
//       {
//         role: "system",
//         content: `You are FinePrint AI, a helpful insurance policy assistant. You help users understand insurance policies, explain complex clauses in simple terms, and answer questions about coverage, exclusions, waiting periods, and claims. Be friendly, clear, and concise. If you don't know something, admit it honestly.`
//       },
//       ...(conversation || []).map(msg => ({
//         role: msg.role,
//         content: msg.content
//       })),
//       {
//         role: "user",
//         content: message
//       }
//     ];

//     const completion = await client.chat.completions.create({
//       model: MODEL,
//       messages: messages,
//       temperature: 0.7,
//       max_tokens: 500
//     });

//     const response = completion.choices[0].message.content;

//     return NextResponse.json({ response });
//   } catch (error) {
//     console.error("Chat API error:", error);
//     return NextResponse.json(
//       { error: "Failed to process request" },
//       { status: 500 }
//     );
//   }
// }