import {
  FlaskConical,
  Fingerprint,
  Hourglass,
  LayoutDashboard,
  Scale,
  Settings,
  Telescope,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/lib/constants/routes";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.thoughts, label: "Thought Lab", icon: FlaskConical },
  { href: ROUTES.patterns, label: "Patterns", icon: Fingerprint },
  { href: ROUTES.predictions, label: "Predictions", icon: Telescope },
  { href: ROUTES.worryCapsules, label: "Worry Capsules", icon: Hourglass },
  { href: ROUTES.decisions, label: "Decision Room", icon: Scale },
  { href: ROUTES.insights, label: "Insights", icon: TrendingUp },
  { href: ROUTES.settings, label: "Settings", icon: Settings },
];

export function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
