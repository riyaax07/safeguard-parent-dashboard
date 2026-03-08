import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { BlockedSite } from "@/types";

export function useBlocklist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: sites = [], isLoading, error, refetch } = useQuery({
    queryKey: ["blocklist", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_sites")
        .select("*")
        .eq("parent_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BlockedSite[];
    },
    enabled: !!user,
  });

  const blockMutation = useMutation({
    mutationFn: async ({ domain, notes }: { domain: string; notes?: string }) => {
      const { error } = await supabase
        .from("blocked_sites")
        .insert({ domain, parent_id: user!.id, notes: notes ?? null });
      if (error) throw error;
    },
    onSuccess: (_, { domain }) => {
      queryClient.invalidateQueries({ queryKey: ["blocklist"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success(`🚫 ${domain} has been blocked`);
    },
    onError: (err: Error) => {
      if (err.message?.includes("duplicate")) {
        toast.error("This domain is already blocked");
      } else {
        toast.error("Failed to block domain");
      }
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blocked_sites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocklist"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("✅ Domain unblocked");
    },
    onError: () => toast.error("Failed to unblock domain"),
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("blocklist-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "blocked_sites", filter: `parent_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["blocklist"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return {
    sites,
    isLoading,
    error,
    refetch,
    blockDomain: (domain: string, notes?: string) => blockMutation.mutateAsync({ domain, notes }),
    unblockDomain: (id: string) => unblockMutation.mutateAsync(id),
    isBlocking: blockMutation.isPending,
  };
}
