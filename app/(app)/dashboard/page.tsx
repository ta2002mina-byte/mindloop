import type { Metadata } from "next";
import { CalendarCheck, CheckCircle2, Hourglass, MessageSquareText, Repeat, Telescope } from "lucide-react";

import { WeeklyThoughtsChart, TrafficMixCard } from "@/components/dashboard/dashboard-charts";
import { PatternSnapshot } from "@/components/dashboard/pattern-snapshot";
import { RecentThoughts } from "@/components/dashboard/recent-thoughts";
import { StatTile } from "@/components/dashboard/stat-tile";
import { TodaysAction } from "@/components/dashboard/todays-action";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { YourMindLoop } from "@/components/dashboard/your-mindloop";
import { getCurrentProfile } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/dashboard/queries";
import { getFirstName } from "@/utils/format";

export const metadata: Metadata = { title: "Dashboard" };

function pendingHint(ready: number, fallback: string): string {
  return ready > 0 ? `${ready} ready to review` : fallback;
}

export default async function DashboardPage() {
  const [profile, data] = await Promise.all([getCurrentProfile(), getDashboardData()]);
  const firstName = getFirstName(profile?.full_name);

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="sr-only">Dashboard</h1>

      <WelcomeCard firstName={firstName} />

      <section aria-label="Your numbers" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Thoughts this week" value={data.thoughtsThisWeek} icon={MessageSquareText} hint={`${data.totalThoughts} in total`} />
        <StatTile label="Loops detected" value={data.loopsDetected} icon={Repeat} hint={`last ${data.patternWindowDays} days`} />
        <StatTile
          label="Predictions pending"
          value={data.predictionsPending}
          icon={Telescope}
          hint={pendingHint(data.predictionsReady, "waiting for their date")}
        />
        <StatTile label="Predictions reviewed" value={data.predictionsReviewed} icon={CalendarCheck} hint="compared with reality" />
        <StatTile
          label="Worry capsules"
          value={data.capsulesTotal}
          icon={Hourglass}
          hint={data.capsulesReady > 0 ? `${data.capsulesReady} ready to open` : "sealed and opened"}
        />
        <StatTile label="Completed actions" value={data.actionsCompleted} icon={CheckCircle2} hint="small steps taken" />
      </section>

      <YourMindLoop summary={data.mindLoop} windowDays={data.patternWindowDays} />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklyThoughtsChart weekly={data.weekly} />
        </div>
        <TrafficMixCard counts={data.trafficMix} windowDays={data.patternWindowDays} />
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentThoughts thoughts={data.recentThoughts} />
        </div>
        <div className="space-y-4 sm:space-y-6">
          <PatternSnapshot patterns={data.topPatterns} windowDays={data.patternWindowDays} entryCount={data.patternEntryCount} />
          <TodaysAction action={data.todayAction} />
        </div>
      </div>
    </div>
  );
}
