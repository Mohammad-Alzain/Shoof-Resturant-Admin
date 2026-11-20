import { getDirection } from "@/Translation/i18n";
import { BrandLogo, GazeLoader } from "@/components/common/Brand";

/** First paint while the router and profile load: the brand's plates look around the table. */
const SplashScreen = () => {
  const dir = getDirection();
  return (
    <div role="status" className="flex h-screen w-full flex-col items-center justify-center gap-5 bg-background text-foreground">
      <GazeLoader className="h-16" />
      <BrandLogo className="h-8 text-brand-ink" />
      <p className="text-sm text-muted-foreground">{dir === "rtl" ? "يرجى الانتظار" : "Loading…"}</p>
    </div>
  );
};

export default SplashScreen;
