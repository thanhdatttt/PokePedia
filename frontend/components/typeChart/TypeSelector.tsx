"use client";

import { X } from "lucide-react";
import { useTypeStore } from "@/stores/pokemonType.store";
import { TypeBadge } from "./TypeBadge";
import { Button } from "@/components/ui/button";
import { sortTypesAlphabetically } from "@/lib/pokemonType";

export function TypeSelector() {
  const chart = useTypeStore((s) => s.chart);
  const selectedTypes = useTypeStore((s) => s.selectedTypes);
  const toggleSelectedType = useTypeStore((s) => s.toggleSelectedType);
  const clearSelectedTypes = useTypeStore((s) => s.clearSelectedTypes);

  if (!chart) return null;

  return (
    <div className="space-y-3 rounded-xl border bg-card/50 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg text-muted-foreground">
          {selectedTypes.length === 0
            ? "Pick 1 or 2 types to check a Pokemon's typing"
            : `Checking: ${selectedTypes.join(" / ")}`}
        </p>
        {selectedTypes.length > 0 && (
          <Button variant="outline" size="sm" className="p-4 hover:cursor-pointer hover:bg-destructive hover:text-white" onClick={clearSelectedTypes}>
            <X className="size-3" />
            Clear
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        {sortTypesAlphabetically(chart.types).map((type) => (
          <TypeBadge
            key={type.name}
            type={type}
            selected={selectedTypes.includes(type.name)}
            onClick={() => toggleSelectedType(type.name)}
          />
        ))}
      </div>
    </div>
  );
}