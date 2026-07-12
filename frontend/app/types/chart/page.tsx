"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Type Chart</h1>
          <p className="text-sm text-muted-foreground">
            Attacking type on the left, defending type on top.
          </p>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "matrix" | "lookup")}>
          <TabsList>
            <TabsTrigger value="matrix">Type matrix</TabsTrigger>
            <TabsTrigger value="lookup">Type calculator</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!isLoading && viewMode === "matrix" && <TypeChartGrid />}
      {!isLoading && viewMode === "lookup" && (
        <div className="space-y-6">
          <TypeSelector />
          <TypeDetailPanel />
        </div>
      )}
    </main>
  );
}