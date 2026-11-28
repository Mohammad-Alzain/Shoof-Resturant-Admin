import { useTranslation } from "react-i18next";

/**
 * Inspired by https://github.com/react-hook-form/error-message/tree/master
 * Note that the Merge type is stolen from an error message from react hook form.
 *
 * Before using Merge<>, I used: `FieldError | undefined`, but TS didn't like that.
 */
export const FormErrorMessage = ({
  error,
  className,
  id,
}: {
  error: any;
  className?: string;
  /** What the field's `aria-describedby` points at. */
  id?: string;
}) => {
  const { t } = useTranslation();
  return (
    error?.message && (
      <p id={id} role="alert" className={"text-destructive text-xs ps-2 pt-2 " + className}>
        {t(error.message)}
      </p>
    )
  );
};
