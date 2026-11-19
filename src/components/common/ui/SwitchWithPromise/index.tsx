import { Switch } from "@/components/ui/switch";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Props {
  value: boolean;
  query?: any;
  onSuccessMsg?: string;
  onSuccessFunction?: (res: any) => any;
  id: number | string;
  valuesBody: (values: any) => any;
}
const SwitchWithPromise = (props: Props) => {
  const [state, setState] = useState(props.value);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { mutate } = props?.query
    ? props.query({
        onSuccess: (res) => {
          setLoading(false);

          setState(!state);
          toast.success(
            props?.onSuccessMsg ? props?.onSuccessMsg : t("success_request")
          );
          if (typeof props?.onSuccessFunction === "function")
            props?.onSuccessFunction(res);
        },
        onError: (error) => {
          setLoading(false);

          toast.error(error?.response?.data?.message);
        },
      })
    : { mutate: undefined };
  const handeSubmit = async (values: any) => {
    if (props?.query) {
      setLoading(true);
      toast(t("loading")); // Show loading toast
      if (typeof props?.valuesBody === "function" && props?.valuesBody) {
        const body = await props?.valuesBody(values);
        await mutate(body); // Wait for mutate to complete
      } else
        await mutate({
          ...values,
        });
    }
  };
  useEffect(() => {
    setState(props?.value);
  }, [props?.value]);
  return (
    <div>
      <Switch
        disabled={loading}
        id="airplane-mode"
        checked={state}
        onCheckedChange={(e: any) => {
          setLoading(true);

          handeSubmit(e ? 1 : 0);
        }}
      ></Switch>
    </div>
  );
};

export default SwitchWithPromise;
