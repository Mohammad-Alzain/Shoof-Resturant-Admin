import { toast } from "sonner";

interface Props {
  err: { response: { status: number } } | any;
  navigate: any;
}
const ErrorsHandler = (props: Props) => {
  if (props?.err?.response?.status === 404)
    props?.navigate({ to: "/dashboard/errors/404" });
  if (props?.err?.response?.status === 400)
    props?.navigate({ to: "/dashboard/errors/400" });
  if (props?.err?.response?.status === 422) {
    Object?.keys(props?.err?.response?.data?.errors)?.forEach((item) =>
      toast?.error(props?.err?.response?.data?.errors[item])
    );

    props?.navigate({ to: "/dashboard/errors/422" });
  }
};

export default ErrorsHandler;
