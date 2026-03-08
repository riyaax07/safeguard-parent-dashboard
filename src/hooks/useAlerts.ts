import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Alert } from "@/types";

export function useAlerts(unreadOnly = false) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading, error, refetch } = useQuery({
    queryKey: ["alerts", user?.id, unreadOnly],
    queryFn: async () => {
      let query = supabase
        .from("alerts")
        .select("*")
        .eq("parent_id", user!.id)
        .order("timestamp", { ascending: false });
      if (unreadOnly) query = query.eq("is_read", false);
      const { data, error } = await query;
      if (error) throw error;
      return data as Alert[];
    },
    enabled: !!user,
  });

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("parent_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("alerts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts", filter: `parent_id=eq.${user.id}` },
        (payload) => {
          const newAlert = payload.new as Alert;
          toast.warning(`⚠️ Suspicious site detected: ${newAlert.domain}`);
          queryClient.invalidateQueries({ queryKey: ["alerts"] });
          queryClient.invalidateQueries({ queryKey: ["stats"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return {
    alerts,
    unreadCount,
    isLoading,
    error,
    refetch,
    markRead: (id: string) => markReadMutation.mutateAsync(id),
    markAllRead: () => markAllReadMutation.mutateAsync(),
  };
}
