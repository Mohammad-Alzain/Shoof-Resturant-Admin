/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { ReactNode } from "react";
import "./index.css"; // Import CSS file for styling

function HoverMenu({
  side,
  children,
  classNameContainer,
  triggerClassName,
  triggerLabel,
  classNameContent,
}: {
  side: "left" | "right";
  children: ReactNode;
  classNameContainer?: string;
  triggerClassName?: string;
  triggerLabel: string;
  classNameContent?: string;
}) {
  return (
    <div className={`dropdown w-[100%] m-4 ${classNameContainer}`}>
      <span className={` hover:text-slate-500 ${triggerClassName}`}>
        {triggerLabel}
      </span>
      <div data-side={side} className={`dropdown-content ${classNameContent}`}>
        {children}
      </div>
    </div>
  );
}

export default HoverMenu;
