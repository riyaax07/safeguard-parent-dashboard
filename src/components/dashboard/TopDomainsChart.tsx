import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface TopDomainsChartProps {
  data: { domain: string; count: number }[];
}

export function TopDomainsChart({ data }: TopDomainsChartProps) {
  if (data.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-sm font-heading">Top Domains</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">No visits recorded today</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader><CardTitle className="text-sm font-heading">Top Domains</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="domain" width={100} tick={{ fontSize: 12, fill: "hsl(215 16% 57%)" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(221 39% 11%)", border: "1px solid hsl(220 15% 20%)", borderRadius: 8 }}
              labelStyle={{ color: "hsl(213 31% 91%)" }}
            />
            <Bar dataKey="count" fill="hsl(162 63% 37%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
