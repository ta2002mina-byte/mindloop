"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormAlert } from "@/components/forms/form-alert";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { NETWORK_ERROR_MESSAGE } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import { profileSchema, type ProfileValues } from "@/lib/validations/auth";

interface ProfileFormProps {
  userId: string;
  email: string;
  fullName: string;
}

export function ProfileForm({ userId, email, fullName }: ProfileFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName },
  });

  const onSubmit = async (values: ProfileValues) => {
    setServerError(null);
    setSaved(false);

    try {
      const supabase = createClient();
      // Row Level Security guarantees this can only ever touch the signed-in user's own row.
      const { data, error } = await supabase
        .from("profiles")
        .update({ full_name: values.fullName })
        .eq("user_id", userId)
        .select("id");

      if (error) {
        console.error("[profiles] Update failed:", error.message);
        setServerError("We couldn't save your changes. Please try again.");
        return;
      }
      if (!data || data.length === 0) {
        setServerError("We couldn't find your profile. Log out and back in, then try again.");
        return;
      }

      setSaved(true);
      router.refresh();
    } catch (caught) {
      console.error("[profiles] Update failed:", caught);
      setServerError(NETWORK_ERROR_MESSAGE);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-md space-y-5">
      {serverError ? <FormAlert variant="error">{serverError}</FormAlert> : null}
      {saved ? <FormAlert variant="success">Your profile is up to date.</FormAlert> : null}

      <TextField
        label="Full name"
        autoComplete="name"
        error={errors.fullName?.message}
        {...register("fullName", { onChange: () => setSaved(false) })}
      />

      <TextField
        label="Email"
        type="email"
        value={email}
        readOnly
        aria-readonly="true"
        hint="Your email is used to log in and can't be changed here."
        className="text-muted-foreground"
      />

      <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
