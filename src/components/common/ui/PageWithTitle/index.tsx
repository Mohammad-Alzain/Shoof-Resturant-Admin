import { useTranslated } from "@/Translation/helper/getTranslation";
import { getDirection } from "@/Translation/i18n";
import { useRouter } from "@tanstack/react-router";
import clsx from "clsx";

import { ArrowRightCircle } from "lucide-react";
import React from "react";

interface Props {
  children: React.ReactNode;
  title?: string;
  className?: string;
  isTranslated?: boolean;
  allowGoBack?: boolean;
}
export const pageContainerClass = "bg-white dark:bg-card";
const PageWithTitle = (props: Props) => {
  const state = useRouter();
  const translatedTitle = useTranslated(props?.title);
  return (
    <div
      className={clsx(
        "flex flex-col w-full px-4 dark:text-white rounded-lg py-6 capitalize ",
        props?.className
      )}
    >
      <div className="flex items-bottom gap-4">
        {props?.allowGoBack && (
          <ArrowRightCircle
            onClick={() => {
              state?.history.back();
            }}
            className={` text-gray-500 dark:text-gray-400 hover:text-primary ${getDirection() === "ltr" && " rotate-180"} transition-all cursor-pointer mt-1`}
            width={30}
            height={30}
          />
        )}
        <h1 className="text-2xl font-semibold ">
          {props?.isTranslated === true || props?.isTranslated === undefined
            ? translatedTitle
            : props?.title}
        </h1>
      </div>

      {props.children}
    </div>
  );
};

export default PageWithTitle;
