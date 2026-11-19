import { getDirection } from "@/Translation/i18n";

export const primaryDashedBtn =
  "rounded-sm w-full transition-all py-1 px-1 hover:text-blue-500 border-2 border-dashed hover:border-blue-500 ";
export const DangerDashedBtn =
  " rounded-sm w-full transition-all w-fit py-1 px-1 hover:text-red-500 border-2 border-dashed hover:border-red-500 ";
export const primarySolidBtn =
  "rounded-sm w-full transition-all py-1 px-1 hover:text-blue-500 border-2 border-Solid hover:border-blue-500 ";
export const DangerSolidBtn =
  " rounded-sm w-full transition-all py-1 px-1 hover:text-red-500 border-2 border-Solid hover:border-red-500 ";
export const headingClassName = `px-4 py-2 font-semibold   rounded-full text-gray-800  dark:text-white  ${getDirection() === "rtl" ? "bg-customGradientRtl" : "bg-customGradientLtr"}  `;
export const navBarAction =
  "hover:bg-primary/10 hover:text-white hover:dark:text-white text-white dark:text-gray-100";

export const actionStyle =
  "px-3 hover:bg-gray-200 text-gray-400  dark:hover:bg-muted hover:text-destructive cursor-pointer ";
