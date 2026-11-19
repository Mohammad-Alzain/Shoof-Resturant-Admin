import React from "react";
interface Props {
  icon: any;
  title: string | number;
  subTitle?: string | number;
  descriptionOfSubtitle?: string;
  bgColor?: string;
  color?: string;
  className?: string;
  item?: string;
}
const IconValueLabelCard = (props: Props) => {
  return (
    <div
      className={` min-w-32 px-4 py-2 h-[7rem]   rounded-xl justify-between text-${props?.color} bg-${props?.bgColor} ${props?.className} flex flex-col `}
    >
      <div>
        {props?.icon && <props.icon className={``} width={15} height={15} />}
        <span className=" font-bold text-3xl">
          {props.title}
          <span className=" text-sm opacity-40">{props?.item}</span>
        </span>
      </div>
      <span className="  text-gray-700 dark:text-gray-200 text-[8pt] font-bold">
        {props.subTitle}
      </span>
      <span className="mt-1 text-gray-500 dark:text-gray-800 text-[7.5pt]">
        {props?.descriptionOfSubtitle}
      </span>
    </div>
  );
};

export default IconValueLabelCard;
