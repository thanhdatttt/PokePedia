"use client";

import { useTypeStore } from "@/stores/pokemonType.store";
import { formatMultiplier } from "@/lib/pokemonType";
import { TypeBadge } from "./TypeBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TypeEffectivenessEntry } from "@/types/pokemonType";

function EffectivenessGroup({
  title,
  entries,
  accentClass,
}: {
  title: string;
  entries: TypeEffectivenessEntry[];
  accentClass: string;
}) {
  const chart = useTypeStore((s) => s.chart);
  if (!chart) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className={`text-md font-medium ${accentClass}`}>
          {title} <span className="text-muted-foreground font-normal">({entries.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {entries.length === 0 && (
          <p className="text-md text-muted-foreground">None</p>
        )}
        {entries.map(({ type, multiplier }) => {
          const typeMeta = chart.types.find((t) => t.name === type);
          if (!typeMeta) return null;
          return (
            <div key={type} className="flex items-center gap-1">
              <TypeBadge type={typeMeta} size="sm" />
              <span className="text-sm text-muted-foreground">
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
    <div className="grid gap-3 md:grid-cols-3">
      <EffectivenessGroup
        title="Weak to"
        entries={effectiveness.weaknesses}
        accentClass="text-red-600 dark:text-red-400"
      />
      <EffectivenessGroup
        title="Resists"
        entries={effectiveness.resistances}
        accentClass="text-emerald-600 dark:text-emerald-400"
      />
      <EffectivenessGroup
        title="Immune to"
        entries={effectiveness.immunities}
        accentClass="text-slate-600 dark:text-slate-300"
      />
    </div>
  );
}