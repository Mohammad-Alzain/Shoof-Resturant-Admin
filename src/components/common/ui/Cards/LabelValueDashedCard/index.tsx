import React from "react";
interface Props {
  label?: string;
  value?: string | number;
  color?: string;
  labelColor?: string;
  valueColor?: string;
}
const LabelValueDashedBorderCard = (props: Props) => {
  return (
    <div className="flex flex-col items-center gap-1 w-fit px-4 py-2 border-2 border-dashed">
      <span className=" text-sm font-bold text-gray-600 dark:text-gray-700 ">
        {props?.label}
      </span>
      <span className=" text-sm  dark:text-gray-800 text-gray-500 ">
        {props?.value}
      </span>
    </div>
  );
};

export default LabelValueDashedBorderCard;
