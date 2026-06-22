import type { Script } from "@/lib/types";

export function ScriptViewer({ script }: { script: Script }) {
  const sections = [
    { label: "HOOK", text: script.hook_text },
    { label: "PROBLEMA", text: script.problem_text },
    { label: "SOLUCIÓN", text: script.solution_text },
    { label: "PRUEBA SOCIAL", text: script.social_proof_text },
    { label: "CTA", text: script.cta_text },
  ];

  return (
    <div className="space-y-3">
      {sections.map((s) => (
        <div key={s.label}>
          <div className="text-[9px] text-terracota tracking-wide font-bold mb-1">{s.label}</div>
          <div className="text-[13px] text-foreground leading-relaxed">{s.text}</div>
        </div>
      ))}
    </div>
  );
}
