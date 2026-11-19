import type React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        poster?: string;
        alt?: string;
        "camera-controls"?: boolean | string;
        "auto-rotate"?: boolean | string;
        "shadow-intensity"?: string;
        exposure?: string;
        loading?: string;
      };
    }
  }
}
