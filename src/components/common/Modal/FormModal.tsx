import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import FormBuilder from "@/components/common/FormBuilder";
import type { FieldProps } from "@/components/common/Fields/interfaces/FieldProps";
import { getDirection } from "@/Translation/i18n";

export interface FormModalProps {
  title: string;
  fields: FieldProps[];
  initialState: Record<string, unknown>;
  /** Returns a react-query mutation (see FormBuilder `query`). */
  query: () => unknown;
  validationSchema?: unknown;
  /** Maps form values to the request body (dates to UTC, "" to null...). */
  valuesBody?: (values: any) => any;
  buttonText?: string;
  /** Width class of the panel (default `sm:max-w-md`). */
  width?: string;
  onDone?: (result: unknown) => void;
}

/**
 * A create/edit form in a side sheet. It slides in from the end edge (right in English, left in Arabic), the fields
 * settle in one after another, and it closes itself on success.
 */
const FormModal = NiceModal.create((props: FormModalProps) => {
  const modal = useModal();
  const { t } = useTranslation();
  return (
    <Sheet open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
      <SheetContent dir={getDirection()} side="right" className={`w-full gap-0 p-0 sm:max-w-md ${props.width ?? ""}`}>
        <SheetHeader className="border-b border-border px-6 py-4 pe-14 text-start">
          <SheetTitle className="flex items-center gap-2.5 text-base">
            <span aria-hidden className="h-5 w-1 rounded-full bg-terracotta" />
            {props.title}
          </SheetTitle>
          <SheetDescription className="sr-only">{t("details")}</SheetDescription>
        </SheetHeader>
        <div className="sheet-form min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <FormBuilder
            query={props.query}
            fields={props.fields}
            initialState={props.initialState}
            validationSchema={props.validationSchema}
            valuesBody={props.valuesBody}
            buttonText={props.buttonText}
            refreshOnSubmit={false}
            onSuccessFunction={(res) => {
              props.onDone?.(res);
              modal.resolve(res);
              modal.hide();
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
});

export default FormModal;
