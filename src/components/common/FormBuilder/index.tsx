/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import { Controller, useForm, FormProvider } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IFormBuilder } from "./interfaces/IFormBuilder";
import FormField from "../Fields";

import { Button } from "@/components/ui/button";

import { useTranslation } from "react-i18next";
import { FormErrorMessage } from "./FormErrorMsg";
import clsx from "clsx";
import { getDirection } from "@/Translation/i18n";
import { toast } from "sonner";
import { parseApiError } from "@/Api/httpClient";
import { Languages } from "lucide-react";
import { LangSwitch, type Lang } from "@/components/common/LangSwitch";
import { FieldTypes } from "../Fields/Enums/Field";
import { FormLangContext } from "../Fields/FormLang";

function Form(props: IFormBuilder<any>) {
  const form = useForm({
    defaultValues: {
      ...props.initialState,
    },
    resolver: props?.validationSchema
      ? zodResolver(props?.validationSchema)
      : undefined,
  });
  const {
    handleSubmit,
    reset,
    register,
    getFieldState,
    setValue,
    getValues,
    watch,

    control,
    formState: { errors },
  } = form;
  // Re-render on every change only when a field depends on the values (showWhen).
  const needsValues = props.fields?.some((f) => f.showWhen) ?? false;
  const liveValues = useWatch({ control: form.control, disabled: !needsValues }) as Record<string, any>;
  const [isDisabled, setIsDisabled] = useState(false);

  // One content language for every bilingual field of the form (English in `name`, Arabic in `pairName`).
  const pairs = (props.fields ?? [])
    .filter((f) => f.control === FieldTypes.bilingual && f.show !== false)
    .map((f) => [f.name as string, ((f as { pairName?: string }).pairName ?? `${String(f.name).replace(/En$/, "")}Ar`) as string] as const);
  const [lang, setLang] = useState<Lang>("en");
  const pairValues = useWatch({ control: form.control, name: pairs.flat(), disabled: !pairs.length }) as unknown[] | undefined;
  const filledIn = (side: 0 | 1) => pairs.some((_, i) => !!String(pairValues?.[i * 2 + side] ?? "").trim());
  const { t } = useTranslation();
  const [apiErrors, setApiErrors] = useState({});
  const hasError = (key: string) => !!errors[key] || !!apiErrors[key];
  const invalidEn = pairs.some(([en]) => hasError(en));
  const invalidAr = pairs.some(([, ar]) => hasError(ar));
  // After a failed save, show the language that holds the error (English first: it is the required one).
  useEffect(() => {
    if (invalidEn) setLang("en");
    else if (invalidAr) setLang("ar");
  }, [invalidEn, invalidAr]);
  // RBC-009: after a 429 (too many attempts) lock the submit button for the
  // server-provided Retry-After (default 60s) and show a countdown.
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Add this useEffect hook to update form values when initialState changes
  useEffect(() => {
    if (props.values) {
      Object.keys(props.values).forEach((key) => {
        setValue(key, props.values[key]);
      });
    }
  }, [setValue, props?.values]);

  const { mutate, isPending } = props?.query
    ? props.query()
    : { mutate: undefined, isPending: false };

  const onSubmit = (data, event) => {
    if (event) {
      event.preventDefault();
    }
    handleSubmitInternal(data);
  };

  const handleSubmitInternal = async (values: any) => {
    if (typeof props?.OnSubmit === "function") await props.OnSubmit(values);

    if (props?.query && mutate) {
      const mutateOptions = {
        onSuccess: (res) => {
          if (
            props.refreshOnSubmit === true ||
            props.refreshOnSubmit === undefined ||
            props.refreshOnSubmit === null
          )
            reset();
          toast.success(
            props?.onSuccessMsg ? props?.onSuccessMsg : t("success_request"),
          );
          if (typeof props?.onSuccessFunction === "function")
            props?.onSuccessFunction(res, getValues());
        },
        onError: (error: any) => {
          if (typeof props?.onErrorFunction === "function")
            props?.onErrorFunction(error, getValues());

          if (error?.response?.status === 429) {
            const retryAfter = Number(error?.response?.headers?.["retry-after"]);
            setCooldown(retryAfter > 0 ? Math.ceil(retryAfter) : 60);
          }

          // Two kinds of 400: validation problem (inline per field) or business-rule text (the client already toasted it).
          const { fieldErrors } = parseApiError(error);
          if (Object.keys(fieldErrors).length) {
            setApiErrors(
              Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v[0]])),
            );
            toast.error(t("correct_the_errors"));
          }
        },
      };

      if (typeof props?.valuesBody === "function" && props?.valuesBody) {
        const body = await props?.valuesBody(values);
        mutate(body, mutateOptions);
      } else {
        mutate({ ...values }, mutateOptions);
      }
    }
  };
  useEffect(() => {
    if (props?.onChange && typeof props?.onChange === "function") {
      const subscription = watch((value) => props?.onChange?.(value));
      return () => subscription.unsubscribe();
    }
  }, [watch, props?.onChange]);

  return (
    <FormProvider {...form}>
      <FormLangContext.Provider value={pairs.length ? { lang } : null}>
      <form
        className={clsx(props?.ContainerClassName, "flex flex-col w-full")}
        style={{ ...props?.ContainerStyle }}
        onSubmit={(e) => {
          e.preventDefault(); // Manually prevent reload just in case
          handleSubmit(onSubmit)(e); // Ensure React Hook Form handles validation
        }}
      >
        {pairs.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-3.5 py-2.5">
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Languages className="size-4 text-terracotta" aria-hidden />
              {t("content_language")}
              <span className="hidden text-xs font-normal text-muted-foreground sm:inline">· {t("content_language_hint")}</span>
            </span>
            <LangSwitch
              value={lang}
              onChange={setLang}
              label={t("content_language")}
              invalid={{ en: invalidEn, ar: invalidAr }}
              filled={{ en: filledIn(0), ar: filledIn(1) }}
            />
          </div>
        )}
        {props.fields?.map(({ setValue, ...item }, key) => {
          return (
            item?.show !== false && (!item?.showWhen || item.showWhen(liveValues ?? {})) && (
              <div
                className={clsx(item?.className, "flex flex-col gap-0 mb-2")}
                key={key}
              >
                <Controller
                  control={control}
                  name={item?.name}
                  render={({ field: { onChange, value } }) => {
                    return (
                      <FormField
                        {...item}
                        setSubmitDisabled={setIsDisabled}
                        errors={errors}
                        controlField={control}
                        getFieldState={getFieldState}
                        onChange={onChange}
                        value={value}
                        getValues={getValues}
                        register={register}
                        watch={watch}
                        setValue={form.setValue}
                      />
                    );
                  }}
                />

                <FormErrorMessage error={errors[item?.name]} />
                {item?.name && apiErrors[item?.name] && (
                  <FormErrorMessage
                    error={{ message: apiErrors[item?.name] }}
                  />
                )}
              </div>
            )
          );
        })}
        {!props?.hideBtns && (
          <div
            dir={getDirection()}
            className={clsx(
              "flex flex-wrap gap-2 mt-2 w-full items-center flex-row-reverse",
            )}
          >
            <Button
              type="submit"
              loadingText={t("please_wait")}
              className={clsx(
                "w-fit px-4 self-start",
                props?.primaryBtnClassName,
              )}
              disabled={isPending || props?.isPending || isDisabled || cooldown > 0}
              isLoading={isPending || props?.isPending}
            >
              {cooldown > 0
                ? `${t("try_again_in", "Try again in")} ${cooldown}s`
                : !props?.buttonText
                  ? t("ok")
                  : props?.buttonText}
            </Button>

            {props?.seconderyText && (
              <Button
                variant="ghost"
                id={props?.seconderyButtonId}
                type="button"
                className="dark:text-white"
                onClick={() => {
                  if (props?.seconderyButtonSubmit)
                    props?.seconderyButtonSubmit(getValues(), {
                      handleSubmit,
                      reset,
                      register,
                      getFieldState,
                      setValue,
                      getValues,
                      watch,
                    });
                  // reset(props?.initialState);
                }}
                style={{ width: "max-content" }}
              >
                {props.seconderyText}
              </Button>
            )}
          </div>
        )}
      </form>
      </FormLangContext.Provider>
    </FormProvider>
  );
}

const FormBuilder = React.memo(Form);
export default FormBuilder;
