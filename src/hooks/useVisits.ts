import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Visit } from "@/types";

interface UseVisitsParams {
  limit?: number;
  offset?: number;
  deviceId?: string;
  from?: string;
  to?: string;
}

export function useVisits(params: UseVisitsParams = {}) {
  const { limit = 50, offset = 0, deviceId, from, to } = params;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["visits", user?.id, limit, offset, deviceId, from, to],
    queryFn: async () => {
      let query = supabase
        .from("visits")
        .select("*", { count: "exact" })
        .eq("parent_id", user!.id)
        .order("timestamp", { ascending: false })
        .range(offset, offset + limit - 1);

      if (deviceId) query = query.eq("device_id", deviceId);
      if (from) query = query.gte("timestamp", from);
      if (to) query = query.lte("timestamp", to);

      const { data, count, error } = await query;
      if (error) throw error;
      return { visits: (data ?? []) as Visit[], total: count ?? 0 };
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("visits-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "visits", filter: `parent_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["visits"] });
          queryClient.invalidateQueries({ queryKey: ["stats"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return {
    visits: data?.visits ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refetch,
  };
}
