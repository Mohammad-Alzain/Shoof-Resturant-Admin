// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
import { InfoCircle } from "iconsax-react";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
interface props {
  label?: string;
  required?: boolean;
  className?: string;
  toolTipText?: string;
  variant?: string;
  /** id of the control this label names. */
  htmlFor?: string;
}
function InputLabel(props: props) {
  const { t } = useTranslation();
  return (
    <div style={{ display: "flex" }}>
      <label
        htmlFor={props?.htmlFor}
        className={
          props?.className
            ? props.className
            : "form-label  dark:text-gray-300 flex  capitalize  items-center text-gray-700 mb-2 text-sm"
        }
      >
        <>
          {props?.required && (
            <span className="text-destructive me-2 mb-0 ">*</span>
          )}

          {t(props.label)}
        </>
      </label>
      {!!props?.toolTipText && (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoCircle
                  variant="Bold"
                  data-tooltip-id={"form-tooltip"}
                  className="mt-0.5 ms-1 stroke-gray-500" aria-hidden="true"
                  size={16}
                  data-tooltip-content={t(props?.toolTipText)}
                />
              </TooltipTrigger>
              {/* <ReactTooltip
            // position={}
            place="top-end"
            style={{ zIndex: 100000 }}
            className=" z-50 rounded-lg text-[5pt]"
            id={"form-tooltip"}
            variant={props?.variant}
            // content={props?.toolTipText}
          /> */}

              <TooltipContent
                variant="light"
                className=" text-[12px]"
                // variant={props?.variant ?? "light"}
              >
                <p>{t(props?.toolTipText)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}
    </div>
  );
}

export default InputLabel;
