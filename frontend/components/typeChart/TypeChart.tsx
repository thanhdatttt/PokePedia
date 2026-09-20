"use client";

import { useTypeStore } from "@/stores/pokemonType.store";
import { formatMultiplier, multiplierTone, getTypeIcon, MULTIPLIER_TONE_CLASSES } from "@/lib/pokemonType";
import { cn } from "@/lib/utils";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

const TONE_STYLES: Record<string, string> = {
  super: cn(MULTIPLIER_TONE_CLASSES.super, "font-bold"),
  notVery: cn(MULTIPLIER_TONE_CLASSES.notVery, "font-bold"),
  none: cn(MULTIPLIER_TONE_CLASSES.none, "font-bold"),
  neutral: "text-muted-foreground/40",
};

const LEGEND_ITEMS = [
  { label: "Super effective", detail: "2x", tone: "super" },
  { label: "Not very effective", detail: "1/2x", tone: "notVery" },
  { label: "No effect", detail: "0x", tone: "none" },
  { label: "Normal", detail: "1x", tone: "neutral" },
] as const;

export function TypeChartGrid() {
  const chart = useTypeStore((s) => s.chart);
  const hoveredAttacker = useTypeStore((s) => s.hoveredAttacker);
  const hoveredDefender = useTypeStore((s) => s.hoveredDefender);
  const setHovered = useTypeStore((s) => s.setHovered);

  if (!chart) return null;
  const { types, chart: matrix } = chart;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3">
        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-xl border bg-card/50 px-4 py-3 text-xs sm:text-sm">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-5 w-8 items-center justify-center rounded-md text-[10px] font-bold",
                  TONE_STYLES[item.tone],
                )}
              >
                {item.detail}
              </span>
              <span className="text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Mobile scroll hint */}
        <p className="text-xs text-muted-foreground sm:hidden">
          Swipe sideways to see every defending type →
        </p>

        <div className="overflow-auto rounded-xl border shadow-sm">
          <table className="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-20 bg-card p-2 text-xs font-medium text-muted-foreground">
                  atk \ def
                </th>
                {types.map((defender) => (
                  <th
                    key={defender.name}
                    className={cn(
                      "sticky top-0 z-10 whitespace-nowrap bg-card p-1.5 text-center align-bottom transition-colors",
                      hoveredDefender === defender.name && "bg-muted",
                    )}
                  >
                    <div className="mx-auto flex flex-col items-center gap-1 pb-1">
                      <img
                        src={getTypeIcon(defender.name)}
                        alt={defender.name}
                        className="size-5 shrink-0"
                      />
                      <div
                        className="flex h-12 w-5 origin-bottom -rotate-45 items-end justify-start text-[10px] font-semibold capitalize sm:h-14 sm:text-[11px]"
                        style={{ color: defender.color }}
                      >
                        {defender.name}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {types.map((attacker) => (
                <tr key={attacker.name}>
                  <th
                    className={cn(
                      "sticky left-0 z-10 whitespace-nowrap bg-card p-2 text-left text-xs font-semibold capitalize transition-colors",
                      hoveredAttacker === attacker.name && "bg-muted",
                    )}
                  >
                    <span className="flex items-center gap-1.5" style={{ color: attacker.color }}>
                      <img
                        src={getTypeIcon(attacker.name)}
                        alt={attacker.name}
                        className="size-4 shrink-0"
                      />
                      <span className="hidden sm:inline">{attacker.name}</span>
                    </span>
                  </th>
                  {types.map((defender) => {
                    const multiplier = matrix[attacker.name]?.[defender.name] ?? 1;
                    const tone = multiplierTone(multiplier);
                    const isHovered =
                      hoveredAttacker === attacker.name || hoveredDefender === defender.name;

                    return (
                      <Tooltip key={defender.name}>
                        <TooltipTrigger asChild>
                          <td
                            onMouseEnter={() => setHovered(attacker.name, defender.name)}
                            onMouseLeave={() => setHovered(null, null)}
                            className={cn(
                              "h-10 w-10 cursor-default text-center align-middle text-xs transition-all sm:h-11 sm:w-11",
                              TONE_STYLES[tone],
                              isHovered && "scale-105 outline outline-offset-2 outline-foreground/40",
                            )}
                          >
                            {tone === "neutral" ? "" : formatMultiplier(multiplier)}
                          </td>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="capitalize">
                          <span style={{ color: attacker.color }}>{attacker.name}</span>
                          {" → "}
                          <span style={{ color: defender.color }}>{defender.name}</span>
                          {": "}
                          {formatMultiplier(multiplier)} damage
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  );
}