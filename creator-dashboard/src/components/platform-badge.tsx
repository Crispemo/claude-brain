import { PLATFORMS } from "@/lib/constants";

export function PlatformBadge({ platform }: { platform: string }) {
  const config = PLATFORMS.find((p) => p.value === platform);
  if (!config) return <span className="text-[10px] text-muted-foreground">{platform}</span>;
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${config.color}`}>
      {config.label}
    </span>
  );
}
