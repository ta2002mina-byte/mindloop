import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { AccountSection } from "@/components/settings/account-section";
import { PreferencesSection } from "@/components/settings/preferences-section";
import { PrivacySection } from "@/components/settings/privacy-section";
import { ProfileForm } from "@/components/settings/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile, requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getCurrentProfile();

  return (
    <>
      <PageHeader title="Settings" description="Manage how you appear and how MindLoop Lab works for you." />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your name is shown in the header and on your dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm userId={user.id} email={user.email ?? ""} fullName={profile?.full_name ?? ""} />
          </CardContent>
        </Card>

        <PreferencesSection initialNotificationsEnabled={profile?.notifications_enabled ?? true} />
        <PrivacySection />
        <AccountSection />
      </div>
    </>
  );
}
