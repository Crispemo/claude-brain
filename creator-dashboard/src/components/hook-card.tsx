import { Button } from "@/components/ui/button";
import { HOOK_TYPES } from "@/lib/constants";
import type { Hook } from "@/lib/types";

interface HookCardProps {
  hook: Hook;
  onUse: (hook: Hook) => void;
  onAnalyze: (hook: Hook) => void;
}

function formatNum(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

export function HookCard({ hook, onUse, onAnalyze }: HookCardProps) {
  const typeConfig = HOOK_TYPES.find((t) => t.value === hook.type);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="bg-border-light p-4 min-h-[80px] flex items-center justify-center">
        <p className="text-sm font-bold text-foreground text-center leading-snug">&ldquo;{hook.text}&rdquo;</p>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          {typeConfig && (
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${typeConfig.color}`}>{typeConfig.label}</span>
          )}
          <span className="text-[10px] text-muted-foreground">{hook.source}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span className="font-semibold text-foreground">{formatNum(hook.views)}</span>
          <span className="text-muted-foreground">views</span>
          <span className="text-muted-foreground mx-1">·</span>
          <span className="font-semibold text-foreground">{formatNum(hook.saves)}</span>
          <span className="text-muted-foreground">saves</span>
        </div>
        <div className="flex gap-1.5 mt-3">
          <Button size="sm" className="flex-1 h-8 text-[11px] bg-terracota hover:bg-terracota/90" onClick={() => onUse(hook)}>
            Usar →
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => onAnalyze(hook)}>
            Analizar
          </Button>
        </div>
      </div>
    </div>
  );
}
