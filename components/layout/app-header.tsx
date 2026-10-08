import { Menu } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/layout/logout-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserBadge } from "@/components/layout/user-badge";
import { Button } from "@/components/ui/button";
import type { AppUser } from "@/types";

interface AppHeaderProps {
  user: AppUser;
  onOpenNavigation: () => void;
  navigationOpen: boolean;
}

export function AppHeader({ user, onOpenNavigation, navigationOpen }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenNavigation}
          aria-expanded={navigationOpen}
          aria-haspopup="dialog"
        >
          <Menu className="!size-5" aria-hidden="true" />
          <span className="sr-only">Open navigation</span>
        </Button>
        <Logo showWordmark={false} className="sm:hidden" />
        <Logo className="hidden sm:inline-flex" />
      </div>

      {/* Desktop: the sidebar carries the logo, so the header's left side stays empty. */}
      <div className="hidden lg:block" />

      <div className="flex items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <UserBadge user={user} />
        <LogoutButton />
      </div>
    </header>
  );
}
