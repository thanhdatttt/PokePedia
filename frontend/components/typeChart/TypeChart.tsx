"use client";

import { useTypeStore } from "@/stores/pokemonType.store";
import { formatMultiplier, multiplierBucket } from "@/lib/pokemonType";
import { cn } from "@/lib/utils";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

const BUCKET_STYLES: Record<string, string> = {
  weak: "bg-red-500/15 text-red-600 dark:text-red-400 font-semibold",
  resist: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold",
  immune: "bg-slate-900/80 text-slate-100 font-bold dark:bg-slate-100/10",
  neutral: "text-muted-foreground/50",
};

export function TypeChartGrid() {
  const chart = useTypeStore((s) => s.chart);
  const hoveredAttacker = useTypeStore((s) => s.hoveredAttacker);
  const hoveredDefender = useTypeStore((s) => s.hoveredDefender);
  const setHovered = useTypeStore((s) => s.setHovered);

  if (!chart) return null;
  const { types, chart: matrix } = chart;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="overflow-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 bg-background p-2 text-xs text-muted-foreground">
                atk \ def
              </th>
              {types.map((defender) => (
                <th
                  key={defender.name}
                  className={cn(
                    "sticky top-0 z-10 whitespace-nowrap bg-background p-1.5 text-center align-bottom transition-colors",
                    hoveredDefender === defender.name && "bg-muted",
                  )}
                >
                  <div
                    className="mx-auto flex h-16 w-6 origin-bottom -rotate-45 items-end justify-start pb-1 text-[11px] font-medium capitalize"
                    style={{ color: defender.color }}
                  >
                    {defender.name}
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
                    "sticky left-0 z-10 whitespace-nowrap bg-background p-2 text-left text-xs font-medium capitalize transition-colors",
                    hoveredAttacker === attacker.name && "bg-muted",
                  )}
                  style={{ color: attacker.color }}
                >
                  {attacker.name}
                </th>
                {types.map((defender) => {
                  const multiplier = matrix[attacker.name]?.[defender.name] ?? 1;
                  const bucket = multiplierBucket(multiplier);
                  const isHovered =
                    hoveredAttacker === attacker.name || hoveredDefender === defender.name;

                  return (
                    <Tooltip key={defender.name}>
                      <TooltipTrigger asChild>
                        <td
                          onMouseEnter={() => setHovered(attacker.name, defender.name)}
                          onMouseLeave={() => setHovered(null, null)}
                          className={cn(
                            "h-9 w-9 cursor-default text-center align-middle text-xs transition-colors",
                            BUCKET_STYLES[bucket],
                            isHovered && "outline outline-offset-2 outline-foreground/40",
                          )}
                        >
                          {bucket === "neutral" ? "" : formatMultiplier(multiplier)}
                        </td>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="capitalize">
                        <span style={{ color: attacker.color }}>{attacker.name}</span>
                        {" -> "}
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
    </TooltipProvider>
  );
}