import { onKeyActivate } from "@/helpers/a11y";
import { getDirection } from "@/Translation/i18n";
import React from "react";

const Tabs = ({ tabs, activeTab, onSelect, filterRef, containerRef }) => {
  return (
    <div className="flex mt-4 border-b-2 relative dark:border-black/30 w-full pb-4 items-center gap-4 text-sm self-start px-6">
      {tabs.map((tab, index) => (
        <span role="button" tabIndex={0} onKeyDown={onKeyActivate}
          key={tab.id}
          id={tab.id}
          className={`hover:text-sky-300 duration-300 hover:dark:text-sky-300 dark:text-white pb-0 cursor-pointer ${
            activeTab === index ? "text-sky-600 dark:text-sky-600" : ""
          }`}
          onClick={() => onSelect(tab.id, index)}
        >
          {tab.label}
        </span>
      ))}
      <span
        style={{
          width: filterRef?.offsetWidth,
          transform: `translateX(${
            getDirection() === "ltr"
              ? filterRef?.offsetLeft - 24
              : filterRef?.getBoundingClientRect().x +
                -containerRef?.current?.offsetWidth +
                filterRef?.getBoundingClientRect().width +
                24
          }px)`,
        }}
        className="absolute duration-300 border-b-[0.2rem] border-sky-500 bottom-[-0.1rem]"
      />
    </div>
  );
};

export default Tabs;
