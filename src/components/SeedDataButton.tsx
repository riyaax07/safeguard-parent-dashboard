import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { seedDemoData } from "@/lib/seedData";
import { toast } from "sonner";
import { Database, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function SeedDataButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  if (!import.meta.env.DEV) return null;

  const handleSeed = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await seedDemoData(user.id);
      queryClient.invalidateQueries();
      toast.success("Demo data loaded!");
    } catch (err) {
      toast.error("Failed to seed data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleSeed} disabled={loading} className="text-xs">
      {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Database className="h-3 w-3 mr-1.5" />}
      Load Demo Data
    </Button>
  );
}
