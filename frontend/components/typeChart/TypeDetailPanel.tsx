"use client";

import { TrendingUp, ShieldCheck, Ban } from "lucide-react";
import { useTypeStore } from "@/stores/pokemonType.store";
import { formatMultiplier, multiplierTone, MULTIPLIER_TONE_CLASSES } from "@/lib/pokemonType";
import { TypeBadge } from "./TypeBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TypeEffectivenessEntry } from "@/types/pokemonType";
import { cn } from "@/lib/utils";

function EffectivenessGroup({
  title,
  icon: Icon,
  entries,
}: {
  title: string;
  icon: typeof TrendingUp;
  entries: TypeEffectivenessEntry[];
}) {
  const chart = useTypeStore((s) => s.chart);
  if (!chart) return null;

  return (
    <Card className="gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <Icon className="size-4 text-muted-foreground" />
          {title}
          <span className="text-muted-foreground font-normal">({entries.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">None</p>
        )}
        {entries.map(({ type, multiplier }) => {
          const typeMeta = chart.types.find((t) => t.name === type);
          if (!typeMeta) return null;
          const tone = multiplierTone(multiplier);
          return (
            <div key={type} className="flex items-center gap-1">
              <TypeBadge type={typeMeta} size="md" />
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                  MULTIPLIER_TONE_CLASSES[tone],
                )}
              >
                {formatMultiplier(multiplier)}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function TypeDetailPanel() {
  const selectedTypes = useTypeStore((s) => s.selectedTypes);
  const getEffectiveness = useTypeStore((s) => s.getEffectiveness);

  if (selectedTypes.length === 0) return null;
  const effectiveness = getEffectiveness();
  if (!effectiveness) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <EffectivenessGroup title="Weak" icon={TrendingUp} entries={effectiveness.weaknesses} />
      <EffectivenessGroup title="Resist" icon={ShieldCheck} entries={effectiveness.resistances} />
      <EffectivenessGroup title="Immune" icon={Ban} entries={effectiveness.immunities} />
    </div>
  );
}