import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBlocklist } from "@/hooks/useBlocklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Loader2, Globe, Trash2, Ban, Search } from "lucide-react";

const domainSchema = z.object({
  domain: z.string().min(1, "Domain is required").regex(/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/, "Please enter a valid domain (e.g. example.com)"),
  notes: z.string().max(200).optional(),
});

type DomainForm = z.infer<typeof domainSchema>;

export default function Blocklist() {
  const { sites, isLoading, blockDomain, unblockDomain, isBlocking } = useBlocklist();
  const [search, setSearch] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DomainForm>({
    resolver: zodResolver(domainSchema),
  });

  const filtered = useMemo(() => {
    if (!search) return sites;
    return sites.filter((s) => s.domain.toLowerCase().includes(search.toLowerCase()));
  }, [sites, search]);

  const onSubmit = async (data: DomainForm) => {
    try {
      await blockDomain(data.domain.toLowerCase(), data.notes);
      reset();
    } catch {}
  };

  document.title = "Blocklist | SafeGuard";

  return (
    <div className="space-y-6">
      {/* Add Domain */}
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-sm font-heading">Block a Domain</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input id="domain" placeholder="example.com" {...register("domain")} className="bg-secondary border-border" />
              {errors.domain && <p className="text-xs text-destructive">{errors.domain.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" placeholder="Reason for blocking..." {...register("notes")} className="bg-secondary border-border resize-none" rows={2} />
              {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
            </div>
            <Button type="submit" variant="destructive" className="w-full" disabled={isBlocking}>
              {isBlocking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
              Block Domain
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Filter blocked domains..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Ban className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-heading text-lg font-semibold mb-1">No sites blocked yet</h3>
              <p className="text-sm text-muted-foreground">Add your first blocked site above.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
                  <TableHead>Blocked Since</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img src={`https://www.google.com/s2/favicons?domain=${s.domain}&sz=32`} alt="" className="h-4 w-4 rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{s.domain}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{s.notes || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(s.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Unblock {s.domain}?</AlertDialogTitle>
                            <AlertDialogDescription>This will remove the domain from your blocklist. Your child will be able to visit it again.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => unblockDomain(s.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Unblock</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
