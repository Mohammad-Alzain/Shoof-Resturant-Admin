import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getDirection } from "@/Translation/i18n";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import React from "react";
interface Props {
  title?: string;
  children: React.ReactNode;
}
const NiceModalSheet = NiceModal.create((props: Props) => {
  const { hide, visible } = useModal();
  return (
    <Sheet open={visible} onOpenChange={hide}>
      <SheetContent
        dir={getDirection()}
        side={getDirection() === "rtl" ? "left" : "right"}
      >
        <SheetHeader dir={getDirection()}>
          {props?.title && (
            <SheetTitle
              className={`mb-4  text-${getDirection() === "ltr" ? "left" : "right"}`}
            >
              {props.title}
            </SheetTitle>
          )}
        </SheetHeader>
        {props?.children}
      </SheetContent>
    </Sheet>
  );
});

export default NiceModalSheet;
