import { useState } from "react";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getDirection } from "@/Translation/i18n";

/**
 * Show-once secret (API key `plainTextKey`). The value lives only in this dialog's props:
 * it is never written to storage or to the query cache, and closing needs an explicit click.
 */
const SecretKeyDialog = NiceModal.create(({ secret, title }: { secret: string; title?: string }) => {
  const modal = useModal();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
    } catch {
      setCopied(false); // clipboard blocked: the key is selectable below
    }
  };

  return (
    <Dialog open={modal.visible} onOpenChange={() => undefined}>
      <DialogContent dir={getDirection()} className="sm:max-w-lg" close={false} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title ?? t("api_key_created")}</DialogTitle>
          <DialogDescription className="flex items-start gap-2 text-warning">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {t("secret_shown_once")}
          </DialogDescription>
        </DialogHeader>
        <code dir="ltr" className="block select-all break-all rounded-md border border-border bg-muted p-3 font-mono text-sm">
          {secret}
        </code>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? t("copied") : t("copy")}
          </Button>
          <Button type="button" variant="primary" onClick={() => modal.hide()}>
            {t("saved_it")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default SecretKeyDialog;
