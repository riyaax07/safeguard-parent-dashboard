import { useState, useMemo } from "react";
import { formatDistanceToNow, format, isAfter, subDays } from "date-fns";
import { useVisits } from "@/hooks/useVisits";
import { useBlocklist } from "@/hooks/useBlocklist";
import { useDevices } from "@/hooks/useDevices";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Ban, Globe, Search, X, Activity } from "lucide-react";

export default function ActivityPage() {
  const [search, setSearch] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [page, setPage] = useState(0);
  const { visits, total, isLoading } = useVisits({ limit: 50, offset: page * 50, deviceId: deviceFilter === "all" ? undefined : deviceFilter });
  const { sites, blockDomain, isDomainBlocked } = useBlocklist();
  const { devices } = useDevices();

  const blockedDomains = useMemo(() => new Set(sites.map((s) => s.domain)), [sites]);

  const filtered = useMemo(() => {
    if (!search) return visits;
    return visits.filter((v) => v.domain.toLowerCase().includes(search.toLowerCase()));
  }, [visits, search]);

  const clearFilters = () => { setSearch(""); setDeviceFilter("all"); setPage(0); };

  document.title = "Activity | SafeGuard";

  return (
    <div className="space-y-4">
      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
        <span className="text-xs text-primary font-medium">Live</span>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by domain..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border" />
          </div>
          <Select value={deviceFilter} onValueChange={setDeviceFilter}>
            <SelectTrigger className="w-[180px] bg-secondary border-border">
              <SelectValue placeholder="All Devices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              {devices.map((d) => (
                <SelectItem key={d.device_id} value={d.device_id}>{d.child_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(search || deviceFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-heading text-lg font-semibold mb-1">No activity yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">Once your child's device is connected, visits will appear here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead className="hidden md:table-cell">URL</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="hidden lg:table-cell">Device</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v, i) => (
                  <TableRow key={v.id} className="group">
                    <TableCell className="text-muted-foreground text-xs">{page * 50 + i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img src={`https://www.google.com/s2/favicons?domain=${v.domain}&sz=32`} alt="" className="h-4 w-4 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{v.domain}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {v.full_url ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{v.full_url}</span>
                          </TooltipTrigger>
                          <TooltipContent><p className="text-xs max-w-[400px] break-all">{v.full_url}</p></TooltipContent>
                        </Tooltip>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {isAfter(new Date(v.timestamp), subDays(new Date(), 1))
                        ? formatDistanceToNow(new Date(v.timestamp), { addSuffix: true })
                        : format(new Date(v.timestamp), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{v.device_id}</TableCell>
                    <TableCell>
                      {isDomainBlocked(v.domain) ? (
                        <span className="text-xs text-muted-foreground">✓ Blocked</span>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => blockDomain(v.domain)}>
                          <Ban className="h-3 w-3 mr-1" /> Block
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page + 1} of {Math.ceil(total / 50)}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={(page + 1) * 50 >= total} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
