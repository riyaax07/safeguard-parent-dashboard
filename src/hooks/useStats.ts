import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfDay } from "date-fns";
import type { DashboardStats } from "@/types";

export function useStats() {
  const { user } = useAuth();
  const todayStart = startOfDay(new Date()).toISOString();

  return useQuery<DashboardStats>({
    queryKey: ["stats", user?.id, todayStart],
    queryFn: async () => {
      const [visitsRes, blockedRes, alertsRes] = await Promise.all([
        supabase
          .from("visits")
          .select("domain")
          .eq("parent_id", user!.id)
          .gte("timestamp", todayStart),
        supabase
          .from("blocked_sites")
          .select("id", { count: "exact", head: true })
          .eq("parent_id", user!.id),
        supabase
          .from("alerts")
          .select("id", { count: "exact", head: true })
          .eq("parent_id", user!.id)
          .eq("is_read", false),
      ]);

      const visits = visitsRes.data ?? [];
      const domains = visits.map((v) => v.domain);
      const uniqueDomains = new Set(domains);

      // Count top domains
      const domainCounts: Record<string, number> = {};
      domains.forEach((d) => { domainCounts[d] = (domainCounts[d] || 0) + 1; });
      const topDomains = Object.entries(domainCounts)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        visitsToday: visits.length,
        uniqueDomainsToday: uniqueDomains.size,
        totalBlocked: blockedRes.count ?? 0,
        unreadAlerts: alertsRes.count ?? 0,
        topDomains,
      };
    },
    enabled: !!user,
    refetchInterval: 60000,
  });
}
