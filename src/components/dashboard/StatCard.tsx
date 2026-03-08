import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: "default" | "destructive" | "accent" | "primary";
}

const variantStyles = {
  default: "bg-primary/10 text-primary",
  primary: "bg-primary/10 text-primary",
  destructive: "bg-destructive/10 text-destructive",
  accent: "bg-accent/10 text-accent",
};

export function StatCard({ title, value, icon: Icon, variant = "default" }: StatCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("rounded-xl p-3", variantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold font-heading">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}
