import { asset } from "@/helpers/asset";
import { cn } from "@/lib/utils";

/**
 * The menu as a living wall: columns of real dishes (CC0 photographs, public/images/login/CREDITS.md) drifting past at
 * different speeds and in opposite directions, tilted like a spread seen across the table. Each column holds its list
 * twice so the loop is seamless. Decorative; still under reduced motion.
 */

const COLUMNS = [
  ["hummus", "pizza", "latte", "stew", "avocado"],
  ["shakshuka", "dessert", "burger", "pesto"],
  ["breakfast", "ramen", "pancakes", "kadayif", "salad"],
  ["curry", "steak", "smoothie", "shakshuka"],
  ["avocado", "salad", "latte", "pizza", "dessert"],
];
const SPEED = [64, 82, 58, 76, 70]; // seconds per loop

export function FoodWall({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute left-1/2 top-1/2 flex w-[160%] -translate-x-1/2 -translate-y-1/2 -rotate-[9deg] justify-center gap-3.5 sm:gap-4">
        {COLUMNS.map((col, c) => (
          <div key={c} className="w-[19%] max-w-[180px] shrink-0 overflow-visible" style={{ marginTop: c % 2 ? "-12%" : 0 }}>
            <div
              className="food-wall-col flex flex-col gap-3.5 sm:gap-4"
              style={{ animationDuration: `${SPEED[c]}s`, animationDirection: c % 2 ? "reverse" : "normal" }}
            >
              {[...col, ...col].map((name, i) => (
                <img
                  key={`${name}-${i}`}
                  src={asset(`images/login/wall/${name}.webp`)}
                  alt=""
                  width={300}
                  height={375}
                  decoding="async"
                  fetchPriority="low"
                  className="aspect-[4/5] w-full rounded-2xl object-cover shadow-[0_18px_40px_-18px_rgb(0_0_0/0.7)]"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
