import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  label: string;
  value: string;
  hint: string;
}

export function StatsCard({ label, value, hint }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
