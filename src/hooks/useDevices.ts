import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Device } from "@/types";

export function useDevices() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingExpiresAt, setPairingExpiresAt] = useState<Date | null>(null);

  const { data: devices = [], isLoading, error, refetch } = useQuery({
    queryKey: ["devices", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("parent_id", user!.id)
        .order("registered_at", { ascending: false });
      if (error) throw error;
      return data as Device[];
    },
    enabled: !!user,
  });

  const generatePairingCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    setPairingCode(code);
    setPairingExpiresAt(expires);
    return code;
  };

  return {
    devices,
    isLoading,
    error,
    refetch,
    generatePairingCode,
    pairingCode,
    pairingExpiresAt,
  };
}
