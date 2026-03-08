import { Globe, BarChart3, Ban, AlertTriangle } from "lucide-react";
import { StatCard } from "./StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/types";

interface StatsGridProps {
  stats?: DashboardStats;
  isLoading: boolean;
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Visits Today" value={stats?.visitsToday ?? 0} icon={Globe} variant="primary" />
      <StatCard title="Unique Sites Today" value={stats?.uniqueDomainsToday ?? 0} icon={BarChart3} variant="primary" />
      <StatCard title="Sites Blocked" value={stats?.totalBlocked ?? 0} icon={Ban} variant="destructive" />
      <StatCard
        title="Unread Alerts"
        value={stats?.unreadAlerts ?? 0}
        icon={AlertTriangle}
        variant={(stats?.unreadAlerts ?? 0) > 0 ? "accent" : "default"}
      />
    </div>
  );
}
