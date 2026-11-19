import { createElement, useEffect, useState } from "react";
import { Box } from "lucide-react";
import { isSafeUrl } from "@/helpers/url";

/** `<model-viewer>` for a GLB (and a USDZ for iOS AR). The library is loaded on first use, so it never weighs on other pages. */
export function ModelViewer({ glb, usdz, poster, className }: { glb?: string | null; usdz?: string | null; poster?: string | null; className?: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    import("@google/model-viewer").then(() => live && setReady(true)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  if (!glb || !isSafeUrl(glb)) return null;
  if (!ready)
    return (
      <div className={className} aria-busy="true">
        <div className="grid size-full min-h-56 animate-pulse place-items-center rounded-xl bg-muted text-muted-foreground">
          <Box className="size-8" />
        </div>
      </div>
    );
  return createElement("model-viewer", {
    src: glb,
    "ios-src": usdz && isSafeUrl(usdz) ? usdz : undefined,
    poster: poster && isSafeUrl(poster) ? poster : undefined,
    "camera-controls": true,
    "auto-rotate": true,
    ar: true,
    "shadow-intensity": "1",
    style: { width: "100%", height: "100%", minHeight: "16rem", borderRadius: "0.75rem", background: "var(--muted)" },
    class: className,
  });
}
