import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const { step, session_id, data } = await request.json();

  if (step === 1) {
    // Create or update session with profile data
    if (session_id) {
      await supabase.from("syk_sessions").update({ profile_data: data, step: 1 }).eq("id", session_id);
      return NextResponse.json({ session_id });
    }
    const { data: session } = await supabase.from("syk_sessions").insert({ profile_data: data, step: 1 }).select().single();
    return NextResponse.json({ session_id: session?.id });
  }

  if (step === 2 && process.env.ANTHROPIC_API_KEY) {
    // Bio audit
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: `Analiza y reescribe esta bio de Instagram con criterio comercial. 3 líneas máximo, emoji por línea. Línea 1: cómo ayuda. Línea 2: prueba social real. Línea 3: CTA claro. Sin "agendá tu llamada gratuita". Lenguaje directo.\n\nBio actual: "${data.bio}"\nNegocio: ${data.business_description || "IA + ecommerce"}\n\nResponde SOLO la bio reescrita, texto plano.` }],
    });
    const bio = msg.content[0].type === "text" ? msg.content[0].text : "";
    await supabase.from("syk_sessions").update({ bio_result: bio, step: 2 }).eq("id", session_id);
    return NextResponse.json({ bio });
  }

  if (step === 3) {
    // Feed calendar generation
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const styles = data.styles?.join(", ") || "POV celular, Talking Head, B-Roll voz off, Reacción, Clip cliente, TikTok nativo";
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: `Genera un calendario semanal de contenido (lunes a domingo). ${data.posts_per_day || 2} posts por día. Estilos: ${styles}. REGLA: nunca repetir estilo dos veces seguidas ni en el mismo día. Responde SOLO JSON: {"lunes":["12:00|Estilo","20:00|Estilo"],"martes":[...],...}` }],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    let calendar;
    try { calendar = JSON.parse(text); } catch { calendar = { raw: text }; }
    await supabase.from("syk_sessions").update({ feed_calendar: calendar, step: 3 }).eq("id", session_id);
    return NextResponse.json({ calendar });
  }

  if (step === 5) {
    // Generate 7 scripts
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const batch = data.batch || 1;
    const profileData = data.profile_data || {};

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: `Genera 7 guiones de contenido (batch ${batch}/6) para un creador de IA + ecommerce. Cada guion tiene: HOOK (provocador, rompe scroll), PROBLEMA (causa real con ejemplos concretos), SOLUCIÓN (nuevo paradigma, no tips), PRUEBA SOCIAL (números reales), CTA (entregable + conexión + prueba social). Lenguaje directo como si hablaras con alguien de 16 años. Tono picante. Nunca repitas hook/problema/CTA.\n\nNicho: ${profileData.niche || "IA + ecommerce"}\nAudiencia: ${profileData.audience || "dueños de tiendas online"}\n\nResponde SOLO JSON array: [{"hook":"...","problem":"...","solution":"...","proof":"...","cta":"...","style":"...","day_of_week":0},...]` }],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "[]";
    let scripts;
    try { scripts = JSON.parse(text); } catch { scripts = []; }

    await supabase.from("syk_sessions").update({ scripts_generated: batch * 7, step: 5 }).eq("id", session_id);
    return NextResponse.json({ scripts, batch });
  }

  return NextResponse.json({ error: "Unknown step" }, { status: 400 });
}
