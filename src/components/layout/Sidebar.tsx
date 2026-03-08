import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAlerts } from "@/hooks/useAlerts";
import { Shield, LayoutDashboard, Activity, Ban, AlertTriangle, Smartphone, Settings, LogOut, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/dashboard/activity", icon: Activity, label: "Activity" },
  { to: "/dashboard/blocklist", icon: Ban, label: "Blocklist" },
  { to: "/dashboard/alerts", icon: AlertTriangle, label: "Alerts", badge: true },
  { to: "/dashboard/devices", icon: Smartphone, label: "Devices" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { unreadCount } = useAlerts();
  const navigate = useNavigate();

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "SG";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full w-64 bg-sidebar border-r border-sidebar-border",
        "fixed inset-y-0 left-0 z-50 transition-transform duration-200",
        "lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <Shield className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold font-heading text-foreground">SafeGuard</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose} aria-label="Close sidebar">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-sidebar-accent text-primary border-l-[3px] border-primary pl-[9px]"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
              )
            }
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            <span>{item.label}</span>
            {item.badge && unreadCount > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 bg-primary/20">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">
              {user?.user_metadata?.full_name || user?.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out" className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
