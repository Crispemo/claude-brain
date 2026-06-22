import { NextRequest, NextResponse } from "next/server";
import { analyzeHook } from "@/lib/claude";

export async function POST(request: NextRequest) {
  const { hook_text } = await request.json();
  if (!hook_text) return NextResponse.json({ error: "hook_text required" }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ analysis: "Claude API key no configurada. Ve a Ajustes." });

  const analysis = await analyzeHook(hook_text);
  return NextResponse.json({ analysis });
}
