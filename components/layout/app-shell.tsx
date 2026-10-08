"use client";

import { useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { AppUser } from "@/types";

interface AppShellProps {
  user: AppUser;
  children: React.ReactNode;
}

/** The authenticated frame: fixed sidebar on desktop, drawer on tablet/mobile. */
export function AppShell({ user, children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card/50 lg:block">
        <SidebarNav />
      </aside>

      <div className="min-w-0 lg:pl-64">
        <AppHeader user={user} onOpenNavigation={() => setDrawerOpen(true)} navigationOpen={drawerOpen} />
        <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Move between the sections of MindLoop Lab.</SheetDescription>
          <SidebarNav onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
