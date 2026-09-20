import { publicApi } from "@/lib/api";

export const pokemonTypeService = {
  getAllTypes: async () => {
    try {
      const res = await publicApi.get("/types");
      return { data: res.data, message: res.message };
    } catch (err: any) {
      throw err;
    }
  },

  getChart: async () => {
    try {
      const res = await publicApi.get("/types/chart");
      return { data: res.data, message: res.message };
    } catch (err: any) {
      throw err;
    }
  },

  getByName: async (name: string) => {
    try {
      const res = await publicApi.get(`/types/${name}`);
      return { data: res.data, message: res.message };
    } catch (err: any) {
      throw err;
    }
  },
};