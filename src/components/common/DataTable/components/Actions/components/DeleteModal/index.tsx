import { useState } from "react";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ConfirmShell } from "@/components/common/Modal/ConfirmShell";

interface Props {
  id?: string | number;
  deleteModalTitle?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteQuery?: (id: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row?: any;
  /** Key of the row field shown as the name of the thing being deleted. */
  textAccess?: string;
}

const DeleteTablePopover = NiceModal.create((props: Props) => {
  const { t } = useTranslation();
  const modal = useModal();
  const [isDeleting, setIsDeleting] = useState(false);

  const raw = props.textAccess ? props.row?.[props.textAccess] : undefined;
  const subject = raw !== undefined && raw !== null && raw !== "" ? String(raw) : undefined;

  const onConfirm = async () => {
    setIsDeleting(true);
    try {
      await props.deleteQuery?.(props.id);
      modal.resolve(true);
      modal.hide();
    } catch {
      toast.error(t("something_went_wrong"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmShell
      open={modal.visible}
      danger
      busy={isDeleting}
      title={props.deleteModalTitle ?? t("delete_confirm_title")}
      subject={subject}
      confirmText={t("delete")}
      onCancel={() => modal.hide()}
      onConfirm={onConfirm}
    />
  );
});

export default DeleteTablePopover;
