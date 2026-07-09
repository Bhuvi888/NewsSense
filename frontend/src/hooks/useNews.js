import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

const fetchNews = async () => {
  const { data } = await api.get("/news");
  return data;
};

export function useNews() {
  return useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
  });
}