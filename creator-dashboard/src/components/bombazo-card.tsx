import { Button } from "@/components/ui/button";
import type { ReelMetric } from "@/lib/types";

function fmtNum(n: number): string { return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n); }

export function BombazoCard({ reel, onCreateTrial }: { reel: ReelMetric; onCreateTrial: (reel: ReelMetric) => void }) {
  return (
    <div className="bg-border-light border border-border rounded-xl p-3.5">
      <div className="flex justify-between items-start mb-2">
        <span className="bg-terracota text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">x{reel.bombazo_multiplier?.toFixed(1)}</span>
        <span className="text-[10px] text-muted-foreground">{reel.is_organic ? "100% orgánico" : "Ads"}</span>
      </div>
      <div className="text-[22px] font-extrabold text-foreground">{fmtNum(reel.views)}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">views</div>
      <div className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-snug">&ldquo;{reel.hook_text}&rdquo;</div>
      <div className="flex gap-2 mt-2 text-[10px] text-muted-foreground">
        <span>❤️ {fmtNum(reel.likes)}</span>
        <span>💬 {fmtNum(reel.comments)}</span>
        <span>📌 {fmtNum(reel.saves)}</span>
        <span>📤 {fmtNum(reel.shares)}</span>
      </div>
      <div className="flex gap-2 mt-3">
        <a href={reel.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-terracota-bg text-terracota py-1.5 rounded-md text-[11px] font-medium">Ver en IG ↗</a>
        <Button size="sm" variant="outline" className="text-[11px] h-auto py-1.5 text-terracota border-terracota" onClick={() => onCreateTrial(reel)}>Trial →</Button>
      </div>
    </div>
  );
}
