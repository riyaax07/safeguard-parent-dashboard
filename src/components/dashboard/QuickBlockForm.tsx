import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";
import { useBlocklist } from "@/hooks/useBlocklist";

const DOMAIN_REGEX = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export function QuickBlockForm() {
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");
  const { blockDomain, isBlocking, isDomainBlocked } = useBlocklist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = domain.trim().toLowerCase().replace(/^www\./, "");
    if (!DOMAIN_REGEX.test(trimmed)) {
      setError("Please enter a valid domain (e.g. tiktok.com)");
      return;
    }
    if (isDomainBlocked(trimmed)) {
      setError("This domain is already blocked");
      return;
    }
    setError("");
    try {
      await blockDomain(trimmed);
      setDomain("");
    } catch {}
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader><CardTitle className="text-sm font-heading">Quick Block</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Enter a domain to block (e.g. tiktok.com)"
              value={domain}
              onChange={(e) => { setDomain(e.target.value); setError(""); }}
              className="bg-secondary border-border"
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
          <Button type="submit" variant="destructive" disabled={isBlocking} className="shrink-0">
            {isBlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4 mr-1.5" />}
            Block Now
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
