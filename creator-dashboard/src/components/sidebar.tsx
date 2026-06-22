"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: "📊" },
  { href: "/hooks", label: "Baúl de Ganchos", icon: "🪝" },
  { href: "/metrics", label: "Métricas", icon: "📈" },
  { href: "/competitors", label: "Competencia", icon: "🎯" },
  { href: "/community", label: "Community Manager", icon: "📱" },
  { href: "/calendar", label: "Calendario", icon: "📅" },
  { href: "/trends", label: "Tendencias", icon: "🔥" },
];

const BOTTOM_ITEMS = [
  { href: "/engine", label: "Content Engine", icon: "⚡", highlight: true },
  { href: "/simulia", label: "Simulia", icon: "💊", highlight: false },
  { href: "/settings", label: "Ajustes", icon: "⚙️", highlight: false },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <aside className="hidden md:flex w-[220px] flex-col border-r border-border bg-surface h-screen sticky top-0">
        <div className="px-5 pt-5 pb-1">
          <div className="text-[15px] font-bold text-foreground">Cris</div>
          <div className="text-[10px] text-muted-foreground tracking-wide">AGENCIA + SIMULIA</div>
        </div>

        <nav className="flex-1 px-3 pt-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors",
                isActive(item.href)
                  ? "bg-terracota-bg border-l-[3px] border-terracota text-terracota font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border px-3 py-3 space-y-0.5">
          {BOTTOM_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors",
                isActive(item.href)
                  ? "bg-terracota-bg border-l-[3px] border-terracota text-terracota font-semibold"
                  : item.highlight
                    ? "text-terracota font-semibold hover:bg-terracota-bg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex justify-around py-2 z-50">
        {[NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[5], BOTTOM_ITEMS[0]].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 text-[10px]",
              isActive(item.href) ? "text-terracota" : "text-muted-foreground"
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
