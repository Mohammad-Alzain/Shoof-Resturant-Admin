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
}: {
  error: any;
  className?: string;
}) => {
  const { t } = useTranslation();
  return (
    error?.message && (
      <p role="alert" className={"text-destructive text-xs ps-2 pt-2 " + className}>
        {t(error.message)}
      </p>
    )
  );
};
