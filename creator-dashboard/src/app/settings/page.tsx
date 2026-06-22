"use client";

import { Button } from "@/components/ui/button";

const API_STATUS = [
  { name: "Supabase", env: "NEXT_PUBLIC_SUPABASE_URL", description: "Base de datos PostgreSQL" },
  { name: "Instagram Graph API", env: "INSTAGRAM_ACCESS_TOKEN", description: "Métricas y publicación IG" },
  { name: "YouTube Data API", env: "YOUTUBE_API_KEY", description: "Métricas y publicación YT" },
  { name: "Claude (Anthropic)", env: "ANTHROPIC_API_KEY", description: "Análisis de hooks, generación de guiones" },
  { name: "Whisper (OpenAI)", env: "OPENAI_API_KEY", description: "Transcripción de audio de reels" },
];

export default function SettingsPage() {
  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-foreground mb-5">Ajustes</h1>

      <div className="bg-card border border-border rounded-xl p-4 mb-5">
        <div className="text-[11px] text-muted-foreground tracking-wide mb-3">ESTADO DE APIs</div>
        <div className="space-y-3">
          {API_STATUS.map((api) => (
            <div key={api.name} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">{api.name}</div>
                <div className="text-[11px] text-muted-foreground">{api.description}</div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-status-scheduled/20 text-status-scheduled font-medium">
                Configurar en .env
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-4 border-t border-border pt-3">
          Las API keys se configuran como variables de entorno en Vercel. No se almacenan en la base de datos.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 mb-5">
        <div className="text-[11px] text-muted-foreground tracking-wide mb-3">CRON JOBS</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-foreground">Métricas sync</span><span className="text-muted-foreground">Diario 2:00am</span></div>
          <div className="flex justify-between"><span className="text-foreground">Bombazo detect</span><span className="text-muted-foreground">Diario 3:00am</span></div>
          <div className="flex justify-between"><span className="text-foreground">Tendencias scan</span><span className="text-muted-foreground">Diario 7:00am</span></div>
          <div className="flex justify-between"><span className="text-foreground">Competencia scrape</span><span className="text-muted-foreground">Domingos 6:00am</span></div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="text-[11px] text-muted-foreground tracking-wide mb-3">SESIÓN</div>
        <Button variant="outline" className="text-sm text-red-500 border-red-200" onClick={handleLogout}>Cerrar sesión</Button>
      </div>
    </div>
  );
}
