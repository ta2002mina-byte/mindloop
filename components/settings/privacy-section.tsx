import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const POINTS = [
  {
    title: "Your entries are yours",
    body: "Thoughts, facts, stories, emotions, predictions, worry capsules and decisions are stored under your account and protected by database-level access rules. No other user can read, edit or delete them.",
  },
  {
    title: "Pattern detection runs on your data only",
    body: "Patterns and triggers are calculated from your own entries, on the server, and are never compared against other users' data.",
  },
  {
    title: "AI analysis is optional",
    body: "\u201cAnalyze with AI\u201d sends the text of that one thought to the configured AI provider to help you reflect. Nothing is sent unless you choose to use that feature, and you can edit the result before saving it.",
  },
  {
    title: "You can leave at any time",
    body: "Deleting your account permanently removes your profile and everything linked to it. This cannot be undone.",
  },
] as const;

export function PrivacySection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy</CardTitle>
        <CardDescription>How MindLoop Lab handles your data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {POINTS.map((point) => (
          <div key={point.title}>
            <p className="text-sm font-medium">{point.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{point.body}</p>
          </div>
        ))}

        <p className="border-t pt-5 text-sm text-muted-foreground">
          MindLoop Lab is a self-reflection tool and is not a substitute for professional mental health care.
        </p>
      </CardContent>
    </Card>
  );
}
