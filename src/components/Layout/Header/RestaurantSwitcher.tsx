import { Check, ChevronsUpDown, Store } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCurrentRestaurant, useRestaurantStore } from "@/modules/shared/core/restaurant";

/** Only shown when the account owns more than one restaurant: every list and form then works on the selected one. */
export function RestaurantSwitcher() {
  const { restaurant, all } = useCurrentRestaurant();
  const select = useRestaurantStore((s) => s.select);
  if (all.length < 2 || !restaurant) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex">
        <Store className="size-4 text-primary" />
        <span className="max-w-[10rem] truncate">{restaurant.name}</span>
        <ChevronsUpDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        {all.map((r) => (
          <DropdownMenuItem key={r.id} onClick={() => select(r.id)} className="gap-2">
            <span className="flex-1 truncate">{r.name}</span>
            {r.id === restaurant.id && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
