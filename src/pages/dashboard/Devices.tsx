import { useState, useEffect } from "react";
import { useDevices } from "@/hooks/useDevices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Smartphone, Plus, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";

export default function Devices() {
  const { devices, isLoading, generatePairingCode, pairingCode, pairingExpiresAt } = useDevices();
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!pairingExpiresAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((pairingExpiresAt.getTime() - Date.now()) / 1000));
      setCountdown(diff);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pairingExpiresAt]);

  const copyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      toast.success("Code copied to clipboard");
    }
  };

  document.title = "Devices | SafeGuard";

  return (
    <div className="space-y-6">
      {/* Connected Devices */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-4">Connected Devices</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[120px]" />)}
          </div>
        ) : devices.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Smartphone className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-heading font-semibold mb-1">No devices connected</h3>
              <p className="text-sm text-muted-foreground">Generate a pairing code below to connect a device.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((d) => {
              const isOnline = d.last_seen && differenceInMinutes(new Date(), new Date(d.last_seen)) < 5;
              return (
                <Card key={d.id} className="bg-card border-border">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2.5">
                        <Smartphone className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{d.child_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{d.device_id}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={isOnline ? "default" : "secondary"} className={isOnline ? "bg-primary/20 text-primary" : ""}>
                            {isOnline ? "Online" : "Offline"}
                          </Badge>
                          {d.last_seen && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(d.last_seen), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Pairing */}
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-sm font-heading">Add New Device</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {pairingCode && countdown > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 p-6 bg-secondary rounded-lg">
                <span className="text-4xl font-mono font-bold tracking-[0.3em] text-foreground">{pairingCode}</span>
                <Button variant="ghost" size="icon" onClick={copyCode} aria-label="Copy code">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Expires in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
              </p>
              <p className="text-center text-xs text-muted-foreground">
                Install the SafeGuard Chrome Extension on your child's device, then enter this code when prompted.
              </p>
              <Button variant="outline" className="w-full" onClick={generatePairingCode}>
                <RefreshCw className="h-4 w-4 mr-2" /> Generate New Code
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={generatePairingCode}>
              <Plus className="h-4 w-4 mr-2" /> Generate Pairing Code
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
