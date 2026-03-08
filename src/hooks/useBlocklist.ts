import { useEffect, useCallback } from "react";
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
      const { data, error } = await supabase
        .from("blocked_sites")
        .insert({
          domain: domain.toLowerCase().trim(),
          parent_id: user!.id,
          notes: notes || null,
        })
        .select()
        .single();
      if (error) {
        if (error.code === "23505") throw new Error(`${domain} is already blocked`);
        throw error;
      }
      return data as BlockedSite;
    },
    onSuccess: (newSite) => {
      queryClient.setQueryData(["blocklist", user?.id], (old: BlockedSite[] = []) => {
        if (old.some((s) => s.id === newSite.id)) return old;
        return [newSite, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success(`🚫 ${newSite.domain} has been blocked`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to block domain");
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blocked_sites")
        .delete()
        .eq("id", id)
        .eq("parent_id", user!.id);
      if (error) throw error;
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(["blocklist", user?.id], (old: BlockedSite[] = []) =>
        old.filter((s) => s.id !== deletedId)
      );
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("✅ Domain unblocked");
    },
    onError: () => toast.error("Failed to unblock domain"),
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`blocklist-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "blocked_sites", filter: `parent_id=eq.${user.id}` },
        (payload) => {
          queryClient.setQueryData(["blocklist", user.id], (old: BlockedSite[] = []) => {
            if (old.some((s) => s.id === payload.new.id)) return old;
            return [payload.new as BlockedSite, ...old];
          });
          queryClient.invalidateQueries({ queryKey: ["stats"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "blocked_sites", filter: `parent_id=eq.${user.id}` },
        (payload) => {
          queryClient.setQueryData(["blocklist", user.id], (old: BlockedSite[] = []) =>
            old.filter((s) => s.id !== payload.old.id)
          );
          queryClient.invalidateQueries({ queryKey: ["stats"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const isDomainBlocked = useCallback(
    (domain: string) => sites.some((s) => s.domain === domain.toLowerCase().trim()),
    [sites]
  );

  return {
    sites,
    isLoading,
    error,
    refetch,
    blockDomain: (domain: string, notes?: string) => blockMutation.mutateAsync({ domain, notes }),
    unblockDomain: (id: string) => unblockMutation.mutateAsync(id),
    isBlocking: blockMutation.isPending,
    isUnblocking: unblockMutation.isPending,
    isDomainBlocked,
  };
}
