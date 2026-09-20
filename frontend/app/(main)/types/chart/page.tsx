"use client";

import { useEffect } from "react";
import { Swords } from "lucide-react";
import { useTypeStore } from "@/stores/pokemonType.store";
import { TypeSelector } from "@/components/typeChart/TypeSelector";
import { TypeDetailPanel } from "@/components/typeChart/TypeDetailPanel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TypeChartGrid } from "@/components/typeChart/TypeChart";

export default function TypeChartPage() {
  const fetchChart = useTypeStore((s) => s.fetchChart);
  const isLoading = useTypeStore((s) => s.isLoading);
  const viewMode = useTypeStore((s) => s.viewMode);
  const setViewMode = useTypeStore((s) => s.setViewMode);
  const selectedTypes = useTypeStore((s) => s.selectedTypes);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Swords className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Type Chart</h1>
            <p className="text-sm text-muted-foreground">
              {viewMode === "matrix"
                ? "Attacking type on the left, defending type on top."
                : "Pick a type (or two) to see what it's effectiveness"}
            </p>
          </div>
        </div>
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "matrix" | "lookup")}
          className="w-full sm:w-auto"
        >
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="matrix" className="p-4 flex-1 sm:flex-none">
              Type matrix
            </TabsTrigger>
            <TabsTrigger value="lookup" className="p-4 flex-1 sm:flex-none">
              Type calculator
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && viewMode === "matrix" && <TypeChartGrid />}
      {!isLoading && viewMode === "lookup" && (
        <div className="space-y-6">
          <TypeSelector />
          {selectedTypes.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Select a type above to see its effectiveness.
            </div>
          ) : (
            <TypeDetailPanel />
          )}
        </div>
      )}
    </main>
  );
}