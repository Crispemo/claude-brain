import Anthropic from "@anthropic-ai/sdk";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function analyzeHook(hookText: string): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: `Analiza este hook de contenido de redes sociales. Explica por qué funciona: la estructura, la emoción que genera, el patrón psicológico. Sé directo. En español.\n\nHook: "${hookText}"` }],
  });
  return message.content[0].type === "text" ? message.content[0].text : "";
}

export async function classifyTrend(title: string, source: string): Promise<{ category: string; angle: string }> {
  const client = getClient();
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{ role: "user", content: `Clasifica esta tendencia para un creador de contenido sobre IA + ecommerce (Shopify). Responde SOLO JSON.\n\nTítulo: "${title}"\nFuente: ${source}\n\nFormato: {"category": "gancho"|"explicativo"|"ignorar", "angle": "ángulo sugerido en español, 1-2 frases"}` }],
  });
  const text = message.content[0].type === "text" ? message.content[0].text : '{"category":"ignorar","angle":""}';
  try { return JSON.parse(text); } catch { return { category: "ignorar", angle: "" }; }
}
