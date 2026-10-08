import { AppShell } from "@/components/layout/app-shell";
import { getCurrentProfile, requireUser } from "@/lib/auth/session";
import type { AppUser } from "@/types";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  // The middleware already redirects visitors, but every protected render re-checks on the server.
  const user = await requireUser();
  const profile = await getCurrentProfile();

  const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;

  // Only pass what the UI needs to the client shell, never the raw Supabase user object.
  const appUser: AppUser = {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? metadataName,
    avatarUrl: profile?.avatar_url ?? null,
  };

  return <AppShell user={appUser}>{children}</AppShell>;
}
