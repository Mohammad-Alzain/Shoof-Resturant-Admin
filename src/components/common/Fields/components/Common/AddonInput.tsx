import React, { ReactNode } from "react";
import i18next from "@/Translation/i18n";

interface Props {
  position: "end" | "start";
  value: ReactNode | string;
  isFocused?: boolean;
  className?: string;
}
// ${position === "start" ? "border-e-[0.11rem] border-gray-300" : ""}
// ${position === "end" ? "border-s-[0.11rem] border-gray-300" : ""}
function AddonInput(props: Props) {
  const { position, value, isFocused } = props;
  const t = i18next.t;
  return (
    <span
      className={`flex justify-center duration-200 text-nowrap transition-all  items-center font-extrabold text-xs h-[42px] px-4

        ${isFocused ? " text-primary" : "text-[#B2BEC3]"}
        ${position === "start" ? "rounded-r-none" : ""}
        ${position === "end" ? "rounded-l-none" : ""} ${props?.className}
      `}
    >
      {typeof value === "object" ? value : t(value?.toString())}
    </span>
  );
}

export default AddonInput;
