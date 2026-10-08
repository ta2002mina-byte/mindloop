/**
 * The report lives outside the app shell: no sidebar, no header, nothing that
 * would end up in a printout. The root layout still provides the fonts, the
 * theme and the global styles.
 */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-background print:bg-white">{children}</div>;
}
