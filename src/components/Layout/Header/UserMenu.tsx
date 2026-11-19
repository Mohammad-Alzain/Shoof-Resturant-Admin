import { LogOut, User as UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useAuthStore from "@/modules/Auth/core/store/AuthStore";

const initialsOf = (name?: string, email?: string) => {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return letters.toUpperCase();
};

export function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { auth, logOutAction } = useAuthStore();
  const user = auth?.user;

  const signOut = async () => {
    await logOutAction();
    navigate({ to: "/login" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={t("account")}
      >
        <Avatar className="size-9 border border-border">
          <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
            {initialsOf(user?.name, user?.email)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 py-2">
          <Avatar className="size-10 border border-border">
            <AvatarFallback className="bg-accent text-sm font-semibold text-accent-foreground">
              {initialsOf(user?.name, user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{user?.name || t("account")}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/profile" })} className="gap-2">
          <UserIcon className="size-4" />
          {t("my_profile")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive focus:text-destructive">
          <LogOut className="size-4" />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
