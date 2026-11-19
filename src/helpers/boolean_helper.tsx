import { TickCircle, CloseCircle } from "iconsax-react";

export const getIconFromBoolean = (value: boolean) => {
  return value ? <TickCircle /> : <CloseCircle />;
};
