import { useStats } from "@/hooks/useStats";
import { useVisits } from "@/hooks/useVisits";
import { useBlocklist } from "@/hooks/useBlocklist";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { RecentActivityTable } from "@/components/dashboard/RecentActivityTable";
import { TopDomainsChart } from "@/components/dashboard/TopDomainsChart";
import { QuickBlockForm } from "@/components/dashboard/QuickBlockForm";
import { SeedDataButton } from "@/components/SeedDataButton";

export default function Overview() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { visits, isLoading: visitsLoading } = useVisits({ limit: 10 });
  const { sites, blockDomain } = useBlocklist();

  document.title = "Overview | SafeGuard";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <SeedDataButton />
      </div>
      <StatsGrid stats={stats} isLoading={statsLoading} />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RecentActivityTable visits={visits} isLoading={visitsLoading} blockedSites={sites} onBlock={(d) => blockDomain(d)} />
        </div>
        <div className="lg:col-span-2">
          <TopDomainsChart data={stats?.topDomains ?? []} />
        </div>
      </div>
      <QuickBlockForm />
    </div>
  );
}
