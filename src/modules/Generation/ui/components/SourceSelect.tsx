import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ModelSource } from "../../core/api";

export const SOURCE_LABEL: Record<ModelSource, string> = {
  [ModelSource.Auto]: "source_auto",
  [ModelSource.Text]: "source_text",
  [ModelSource.Image]: "source_image",
  [ModelSource.ImageAndText]: "source_image_text",
};

/** Picks what a 3D model is generated from; Image and Image + text need the dish to have a photo. */
export function SourceSelect({ value, onChange, disabled }: { value: ModelSource; onChange: (v: ModelSource) => void; disabled?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground" id="model-source-label">{t("model_source")}</p>
      <div role="radiogroup" aria-labelledby="model-source-label" className="flex flex-wrap gap-1.5">
        {[ModelSource.Auto, ModelSource.Text, ModelSource.Image, ModelSource.ImageAndText].map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={value === s}
            disabled={disabled}
            onClick={() => onChange(s)}
            className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50", value === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary/40")}
          >
            {t(SOURCE_LABEL[s])}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t(`${SOURCE_LABEL[value]}_hint`)}</p>
    </div>
  );
}
