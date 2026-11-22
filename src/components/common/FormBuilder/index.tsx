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
  const { t } = useTranslation();
  const [apiErrors, setApiErrors] = useState({});
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
      <form
        className={clsx(props?.ContainerClassName, "flex flex-col w-full")}
        style={{ ...props?.ContainerStyle }}
        onSubmit={(e) => {
          e.preventDefault(); // Manually prevent reload just in case
          handleSubmit(onSubmit)(e); // Ensure React Hook Form handles validation
        }}
      >
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
    </FormProvider>
  );
}

const FormBuilder = React.memo(Form);
export default FormBuilder;
