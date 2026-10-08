import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AppUser } from "@/types";
import { getInitials } from "@/utils/format";

export function UserBadge({ user }: { user: AppUser }) {
  const displayName = user.fullName?.trim() || user.email;

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar>
        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
        <AvatarFallback aria-hidden="true">{getInitials(user.fullName, user.email)}</AvatarFallback>
      </Avatar>
      <div className="hidden min-w-0 sm:block">
        <p className="max-w-[10rem] truncate text-sm font-medium leading-tight">{displayName}</p>
        {user.fullName ? <p className="max-w-[10rem] truncate text-xs text-muted-foreground">{user.email}</p> : null}
      </div>
      <span className="sr-only sm:hidden">Signed in as {displayName}</span>
    </div>
  );
}
