import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";

interface FormAlertProps {
  variant: "error" | "success";
  title?: string;
  children: React.ReactNode;
}

/** Errors are announced immediately (role=alert); success is announced politely (role=status). */
export function FormAlert({ variant, title, children }: FormAlertProps) {
  const isError = variant === "error";

  return (
    <Alert variant={isError ? "destructive" : "success"} role={isError ? "alert" : "status"}>
      {isError ? <AlertCircle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
      <div className="space-y-0.5">
        {title ? <p className="font-medium">{title}</p> : null}
        <p>{children}</p>
      </div>
    </Alert>
  );
}
