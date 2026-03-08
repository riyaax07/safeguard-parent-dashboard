import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Ban, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Visit } from "@/types";
import type { BlockedSite } from "@/types";

interface RecentActivityTableProps {
  visits: Visit[];
  isLoading: boolean;
  blockedSites: BlockedSite[];
  onBlock: (domain: string) => void;
}

function Favicon({ domain }: { domain: string }) {
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      alt=""
      className="h-4 w-4 rounded-sm"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}

export function RecentActivityTable({ visits, isLoading, blockedSites, onBlock }: RecentActivityTableProps) {
  const blockedDomains = new Set(blockedSites.map((s) => s.domain));

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-sm font-heading">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 mb-2" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader><CardTitle className="text-sm font-heading">Recent Activity</CardTitle></CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No activity recorded yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.slice(0, 10).map((visit) => (
                <TableRow key={visit.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Favicon domain={visit.domain} />
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{visit.domain}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(visit.timestamp), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {blockedDomains.has(visit.domain) ? (
                      <span className="text-xs text-muted-foreground">Blocked</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
                        onClick={() => onBlock(visit.domain)}
                      >
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
  );
}
