import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { hook_text, problem_text, cta_text, platforms } = await request.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      ig: `${hook_text}\n\n${problem_text}\n\n${cta_text}\n\n#contenido #ia #ecommerce`,
      tt: `${hook_text} ${cta_text} #fyp #ia`,
      yt: hook_text,
    });
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Genera descripciones para redes sociales. En español. Incluye hashtags.\n\nHook: "${hook_text}"\nProblema: "${problem_text}"\nCTA: "${cta_text}"\nPlataformas: ${(platforms || ["ig", "tt", "yt"]).join(", ")}\n\nResponde SOLO JSON: {"ig":"...", "tt":"...", "yt":"..."}`,
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ ig: text, tt: text, yt: text });
  }
}
