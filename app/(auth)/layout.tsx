import { BrandPanel } from "@/components/auth/brand-panel";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <BrandPanel />

      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Logo className="lg:hidden" />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <main className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </main>

        <footer className="px-6 pb-6 text-center text-xs text-muted-foreground">
          MindLoop Lab is a self-reflection tool and is not a substitute for professional mental health care.
        </footer>
      </div>
    </div>
  );
}
