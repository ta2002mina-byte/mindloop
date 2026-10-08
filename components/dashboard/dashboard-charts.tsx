import { BarChart } from "@/components/charts/bar-chart";
import { TrafficMixBar } from "@/components/charts/traffic-mix-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/queries";
import { formatDayMonth } from "@/utils/date";

export function WeeklyThoughtsChart({ weekly }: { weekly: DashboardData["weekly"] }) {
  const total = weekly.reduce((sum, bucket) => sum + bucket.count, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Thoughts per week</CardTitle>
        <CardDescription>Entries saved in each of the last {weekly.length} weeks. Each column starts on the date shown.</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing saved in this period yet.</p>
        ) : (
          <BarChart
            ariaLabel={`Thoughts saved per week over the last ${weekly.length} weeks`}
            data={weekly.map((bucket) => ({ label: formatDayMonth(bucket.start), value: bucket.count }))}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function TrafficMixCard({ counts, windowDays }: { counts: DashboardData["trafficMix"]; windowDays: number }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Traffic light mix</CardTitle>
        <CardDescription>How your last {windowDays} days of entries read.</CardDescription>
      </CardHeader>
      <CardContent>
        <TrafficMixBar counts={counts} />
      </CardContent>
    </Card>
  );
}
