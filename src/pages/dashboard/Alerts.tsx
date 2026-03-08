import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAlerts } from "@/hooks/useAlerts";
import { useBlocklist } from "@/hooks/useBlocklist";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Ban, CheckCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AlertsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { alerts, unreadCount, isLoading, markRead, markAllRead } = useAlerts(filter === "unread");
  const { blockDomain } = useBlocklist();

  document.title = "Alerts | SafeGuard";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-heading font-semibold">Alerts</h2>
          {unreadCount > 0 && (
            <Badge className="bg-accent text-accent-foreground">{unreadCount} unread</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead()}>Mark All Read</Button>
        )}
      </div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[140px]" />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <CheckCircle className="h-16 w-16 text-primary/40 mb-4" />
          <h3 className="font-heading text-xl font-semibold mb-2">All clear!</h3>
          <p className="text-sm text-muted-foreground">No suspicious activity has been detected.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className={cn(
                "bg-card border-border transition-all",
                !alert.is_read && "border-l-[3px] border-l-accent shadow-md"
              )}
            >
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <div className={cn("shrink-0 mt-0.5", !alert.is_read && "animate-pulse-dot")}>
                    <AlertTriangle className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="font-semibold text-base">{alert.domain}</p>
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                      {alert.matched_keyword}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{alert.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.device_id} • {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => blockDomain(alert.domain)}>
                        <Ban className="h-3 w-3 mr-1" /> Block Domain
                      </Button>
                      {!alert.is_read && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markRead(alert.id)}>
                          <Eye className="h-3 w-3 mr-1" /> Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
