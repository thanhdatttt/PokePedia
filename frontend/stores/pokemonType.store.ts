import { create } from "zustand";
import { computeEffectiveness } from "@/lib/pokemonType";
import { TypeChartState } from "@/types/store";
import { showApiError } from "@/lib/toast";
import { pokemonTypeService } from "@/services/pokemonType.service";

export const useTypeStore = create<TypeChartState>((set, get) => ({
  chart: null,
  isLoading: false,
  viewMode: "matrix",
  selectedTypes: [],
  hoveredAttacker: null,
  hoveredDefender: null,

  getEffectiveness: () => {
    const { chart, selectedTypes } = get();
    if (!chart || selectedTypes.length === 0) return null;
    return computeEffectiveness(chart, selectedTypes);
  },

  fetchChart: async () => {
    // check state
    if (get().chart || get().isLoading) return;
    try {
      set({ isLoading: true });
      const { data } = await pokemonTypeService.getChart();
      set({ chart: data });
    } catch (err: any) {
      showApiError(err, "Failed to load type chart");
    } finally {
      set({ isLoading: false });
    }
  },

  setViewMode: (viewMode) => {
    set({ viewMode });
  },

  setHovered: (hoveredAttacker, hoveredDefender) => {
    set({ hoveredAttacker, hoveredDefender });
  },


  toggleSelectedType: (name) =>
    set((state) => {
      const isSelected = state.selectedTypes.includes(name);
      if (isSelected) {
        return { selectedTypes: state.selectedTypes.filter((t) => t !== name) };
      }
      // cap at 2 types
      if (state.selectedTypes.length >= 2) {
        return { selectedTypes: [state.selectedTypes[1], name] };
      }
      return { selectedTypes: [...state.selectedTypes, name] };
    }),

  clearSelectedTypes: () => {
    set({ selectedTypes: [] })
  },
}));