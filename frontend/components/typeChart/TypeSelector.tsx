"use client";

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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedTypes.length === 0 ? (
            "Pick 1 or 2 types to check a Pokemon's typing"
          ) : `Checking type: ${selectedTypes.join("/ ")}`
          }
        </p>
        {selectedTypes.length > 0 && (
          <Button className="h-10 w-28 hover:cursor-pointer" onClick={clearSelectedTypes}>
            Clear
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
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