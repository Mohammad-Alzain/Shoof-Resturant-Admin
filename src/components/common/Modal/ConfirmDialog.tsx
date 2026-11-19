import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";
import { ConfirmShell } from "./ConfirmShell";

interface Props {
  title: string;
  description?: string;
  confirmText?: string;
  /** Style the confirm button as destructive. */
  danger?: boolean;
  subject?: string;
  neutral?: boolean;
}

const ConfirmDialog = NiceModal.create(({ title, description, confirmText, danger, subject, neutral }: Props) => {
  const { t } = useTranslation();
  const modal = useModal();
  const close = (answer: boolean) => {
    modal.resolve(answer);
    modal.hide();
  };
  return (
    <ConfirmShell
      open={modal.visible}
      title={title}
      description={description}
      danger={danger}
      subject={subject}
      neutral={neutral}
      confirmText={confirmText ?? t("confirm")}
      onCancel={() => close(false)}
      onConfirm={() => close(true)}
    />
  );
});

/** Promise-returning replacement for `window.confirm`: resolves true only when the operator confirms. */
export const confirmAction = (props: Props): Promise<boolean> =>
  NiceModal.show(ConfirmDialog, props).then((v) => v === true);

export default ConfirmDialog;
