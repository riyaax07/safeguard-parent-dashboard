import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Lock, Bell, Loader2, Save, Shield } from "lucide-react";

// --- Schemas ---
const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100, "Name must be under 100 characters"),
  email: z.string().email("Invalid email"),
});

const passwordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

interface NotificationPrefs {
  realtime_alerts: boolean;
  email_daily_summary: boolean;
  alert_sound: boolean;
}

// --- Profile Section ---
function ProfileSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({ full_name: profile.full_name ?? "", email: profile.email });
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: data.full_name })
        .eq("id", user!.id);
      if (error) throw error;
      // Also update auth user metadata so sidebar reflects changes
      await supabase.auth.updateUser({ data: { full_name: data.full_name } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "SG";

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-heading">Profile Information</CardTitle>
            <CardDescription>Update your name and view your account details</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-5">
          <div className="flex items-center gap-4 pb-2">
            <Avatar className="h-14 w-14 bg-primary/20">
              <AvatarFallback className="bg-primary/20 text-primary text-lg font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profile?.full_name || "No name set"}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" {...register("full_name")} className="bg-secondary border-border" />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile?.email ?? ""} disabled className="bg-secondary/50 border-border opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed from the dashboard</p>
          </div>

          <Button type="submit" disabled={!isDirty || updateMutation.isPending} className="w-full sm:w-auto">
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// --- Password Section ---
function PasswordSection() {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      reset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-accent/10 p-2.5">
            <Lock className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-base font-heading">Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" placeholder="••••••••" {...register("newPassword")} className="bg-secondary border-border" />
            {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} className="bg-secondary border-border" />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" variant="outline" disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// --- Notification Preferences Section ---
function NotificationSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["notification-prefs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("notification_preferences")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return (data?.notification_preferences ?? {
        realtime_alerts: true,
        email_daily_summary: false,
        alert_sound: true,
      }) as NotificationPrefs;
    },
    enabled: !!user,
  });

  const updatePref = useMutation({
    mutationFn: async (updated: NotificationPrefs) => {
      const { error } = await supabase
        .from("profiles")
        .update({ notification_preferences: updated as unknown as Record<string, unknown> })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-prefs"] });
      toast.success("Notification preferences saved");
    },
    onError: () => toast.error("Failed to save preferences"),
  });

  const toggle = (key: keyof NotificationPrefs) => {
    if (!prefs) return;
    updatePref.mutate({ ...prefs, [key]: !prefs[key] });
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
        </CardContent>
      </Card>
    );
  }

  const items = [
    {
      key: "realtime_alerts" as const,
      title: "Real-time Alert Toasts",
      description: "Show a toast notification when a new suspicious site is detected",
    },
    {
      key: "alert_sound" as const,
      title: "Alert Sound",
      description: "Play a sound when a new alert arrives (browser notification)",
    },
    {
      key: "email_daily_summary" as const,
      title: "Daily Email Summary",
      description: "Receive a daily email digest of your child's activity and alerts",
    },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-destructive/10 p-2.5">
            <Bell className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-base font-heading">Notification Preferences</CardTitle>
            <CardDescription>Control how and when you receive alerts</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((item, idx) => (
          <div key={item.key}>
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                checked={prefs?.[item.key] ?? false}
                onCheckedChange={() => toggle(item.key)}
                disabled={updatePref.isPending}
                aria-label={item.title}
              />
            </div>
            {idx < items.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// --- Main Settings Page ---
export default function Settings() {
  document.title = "Settings | SafeGuard";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-heading font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>
      <ProfileSection />
      <PasswordSection />
      <NotificationSection />
    </div>
  );
}
