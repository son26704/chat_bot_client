import api from "./api";
import type { SearchWebResponse } from "../types/auth";

export const searchWeb = async (query: string) => {
  const res = await api.get<SearchWebResponse>("/search-web", {
    params: { q: query },
  });
  return res.data; 
};
