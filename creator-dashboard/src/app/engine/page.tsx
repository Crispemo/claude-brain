"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const STEPS = ["Perfil", "Bio", "Feed", "Stories", "Guiones"];

interface ScriptItem { hook: string; problem: string; solution: string; proof: string; cta: string; style: string; }

export default function EnginePage() {
  const [step, setStep] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ audience: "", problem: "", result: "", revenue: "", offer: "", bio: "", styles: "POV celular, Talking Head, B-Roll voz off, Reacción, Clip cliente, TikTok nativo", posts_per_day: "2", rest_days: "", story_views: "" });
  const [bioResult, setBioResult] = useState("");
  const [calendar, setCalendar] = useState<Record<string, string[]> | null>(null);
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [batch, setBatch] = useState(1);

  async function submitStep() {
    setLoading(true);
    if (step === 0) {
      const res = await fetch("/api/engine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: 1, session_id: sessionId, data: profile }) });
      const d = await res.json();
      setSessionId(d.session_id);
      setStep(1);
    } else if (step === 1) {
      const res = await fetch("/api/engine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: 2, session_id: sessionId, data: { bio: profile.bio, business_description: profile.offer } }) });
      const d = await res.json();
      setBioResult(d.bio || "No se pudo generar. Verifica la API key de Claude en Ajustes.");
      setStep(2);
    } else if (step === 2) {
      const res = await fetch("/api/engine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: 3, session_id: sessionId, data: { styles: profile.styles.split(",").map((s) => s.trim()), posts_per_day: parseInt(profile.posts_per_day) } }) });
      const d = await res.json();
      setCalendar(d.calendar);
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      const res = await fetch("/api/engine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: 5, session_id: sessionId, data: { batch, profile_data: profile } }) });
      const d = await res.json();
      if (Array.isArray(d.scripts)) setScripts((prev) => [...prev, ...d.scripts]);
      setBatch((b) => b + 1);
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Content Engine</h1>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className={`px-3 py-1 rounded-full text-[11px] font-medium ${i === step ? "bg-terracota text-white" : i < step ? "bg-status-published text-white" : "bg-card border border-border text-muted-foreground"}`}>{i + 1}. {s}</div>
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="max-w-2xl space-y-4">
          <p className="text-sm text-muted-foreground mb-4">Responde estas preguntas para generar 42 guiones personalizados.</p>
          {[
            { key: "audience", label: "¿A quién ayudas exactamente?", placeholder: "Edad, género, situación laboral..." },
            { key: "problem", label: "¿Cuál es el problema principal de esa persona?", placeholder: "El que la frustra, el que lleva tiempo sin resolver..." },
            { key: "result", label: "¿Qué resultado concreto obtienen tus clientes?", placeholder: "Cifras, tiempos, transformaciones..." },
            { key: "revenue", label: "¿Cuánto facturas / facturan tus clientes?", placeholder: "Números reales..." },
            { key: "offer", label: "¿Qué vendes exactamente y a qué precio?", placeholder: "Mentoría, curso, servicio..." },
            { key: "bio", label: "Pega tu bio actual de Instagram", placeholder: "Tal cual está..." },
            { key: "styles", label: "Tus 6 estilos de contenido (separados por coma)", placeholder: "POV celular, Talking Head..." },
            { key: "posts_per_day", label: "¿Cuántos posts por día?", placeholder: "2" },
            { key: "story_views", label: "Views promedio en stories (5-6 stories/día)", placeholder: "1500" },
          ].map((q) => (
            <div key={q.key}>
              <label className="text-sm font-medium text-foreground">{q.label}</label>
              {q.key === "bio" ? (
                <Textarea value={profile[q.key as keyof typeof profile]} onChange={(e) => setProfile((p) => ({ ...p, [q.key]: e.target.value }))} placeholder={q.placeholder} className="mt-1" rows={3} />
              ) : (
                <Input value={profile[q.key as keyof typeof profile]} onChange={(e) => setProfile((p) => ({ ...p, [q.key]: e.target.value }))} placeholder={q.placeholder} className="mt-1" />
              )}
            </div>
          ))}
        </div>
      )}

      {step === 1 && <div className="text-sm text-muted-foreground">Generando auditoría de bio...</div>}

      {step === 2 && (
        <div className="max-w-2xl">
          <div className="text-[10px] text-terracota font-bold tracking-wide mb-2">BIO OPTIMIZADA</div>
          <div className="bg-card border border-border rounded-lg p-4 whitespace-pre-line text-sm">{bioResult}</div>
          <Button variant="outline" className="mt-3 text-sm" onClick={() => navigator.clipboard.writeText(bioResult)}>Copiar bio</Button>
        </div>
      )}

      {step === 3 && calendar && (
        <div className="max-w-2xl">
          <div className="text-[10px] text-terracota font-bold tracking-wide mb-2">CALENDARIO DE FEED</div>
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            {Object.entries(calendar).map(([day, slots]) => (
              <div key={day} className="flex gap-3 items-start">
                <span className="text-xs font-semibold text-foreground w-20 capitalize">{day}:</span>
                <div className="text-xs text-muted-foreground">{Array.isArray(slots) ? slots.join(" · ") : String(slots)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="max-w-3xl">
          <div className="text-[10px] text-terracota font-bold tracking-wide mb-2">GUIONES ({scripts.length}/42)</div>
          <div className="space-y-3 mb-4">
            {scripts.map((s, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Guion {i + 1} · {s.style}</div>
                <div className="space-y-2 text-sm">
                  <div><span className="text-[9px] text-terracota font-bold">HOOK:</span> {s.hook}</div>
                  <div><span className="text-[9px] text-terracota font-bold">PROBLEMA:</span> {s.problem}</div>
                  <div><span className="text-[9px] text-terracota font-bold">SOLUCIÓN:</span> {s.solution}</div>
                  <div><span className="text-[9px] text-terracota font-bold">PRUEBA SOCIAL:</span> {s.proof}</div>
                  <div><span className="text-[9px] text-terracota font-bold">CTA:</span> {s.cta}</div>
                </div>
              </div>
            ))}
          </div>
          {scripts.length < 42 && <p className="text-xs text-muted-foreground mb-3">Pulsa &ldquo;Siguiente&rdquo; para generar los próximos 7 guiones.</p>}
        </div>
      )}

      <div className="mt-6">
        <Button onClick={submitStep} disabled={loading} className="bg-terracota hover:bg-terracota/90">
          {loading ? "Generando..." : step === 4 && scripts.length >= 42 ? "Finalizar" : "Siguiente →"}
        </Button>
      </div>
    </div>
  );
}
