import { getDirection } from "@/Translation/i18n";
import React, { CSSProperties } from "react";

function InputContainer(props: {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => any;
}) {
  return (
    <div role="presentation"
      dir={getDirection()}
      onClick={props?.onClick}
      style={props?.style}
      className={` ${props.className} `}
    >
      {props.children}
    </div>
  );
}

export default InputContainer;
