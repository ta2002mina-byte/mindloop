"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { NAV_ITEMS, isActiveRoute } from "@/lib/constants/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  /** Called after a link is chosen. The mobile drawer uses it to close itself. */
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link
          href={ROUTES.dashboard}
          onClick={onNavigate}
          aria-label="MindLoop Lab, go to dashboard"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo />
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActiveRoute(pathname, item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {active ? (
                    <span aria-hidden="true" className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-primary" />
                  ) : null}
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 space-y-1 border-t px-5 py-4">
        <p className="text-xs font-medium text-foreground/80">Detect, visualize, understand, test, act.</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          A self-reflection tool, not a substitute for professional mental health care.
        </p>
      </div>
    </div>
  );
}
