import { useQuery } from "@tanstack/react-query";
import { fetchClasses } from "../services/ClassesService";
import { useAuthStore } from "../store/AuthStore";
import type { TurmaResponse } from "../types/StudentClassesResponse";

export function useStudentClasses() {
  const user = useAuthStore((state) => state.user);

  return useQuery<TurmaResponse[]>({
    queryKey: ["classes", user?.matricula],
    enabled: Boolean(user?.matricula),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!user?.matricula) return [];
      const { data } = await fetchClasses(user.matricula);
      return Array.isArray(data) ? data : [];
    },
  });
}