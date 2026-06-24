import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Device } from "@/types";

export function useDevices() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingExpiresAt, setPairingExpiresAt] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: devices = [], isLoading, error, refetch } = useQuery({
    queryKey: ["devices", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("parent_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Device[];
    },
    enabled: !!user,
  });

  const generatePairingCode = async () => {
    if (!user) return null;
    setIsGenerating(true);

    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Insert a pending device row into Supabase with the pairing code
      const { error } = await supabase
        .from("devices")
        .insert({
          parent_id: user.id,
          device_id: crypto.randomUUID(), // temporary, will be updated on pairing
          child_name: "Pending",          // temporary, will be updated on pairing
          pairing_code: code,
          pairing_expires_at: expires.toISOString(),
        });

      if (error) throw error;

      // Save to local state so the UI can display it
      setPairingCode(code);
      setPairingExpiresAt(expires);

      // Refresh devices list
      queryClient.invalidateQueries({ queryKey: ["devices"] });

      return code;
    } catch (err) {
      console.error("Failed to generate pairing code:", err);
      toast.error("Failed to generate pairing code");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    devices,
    isLoading,
    error,
    refetch,
    generatePairingCode,
    pairingCode,
    pairingExpiresAt,
    isGenerating,
  };
}