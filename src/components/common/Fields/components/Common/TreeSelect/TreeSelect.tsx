import { onKeyActivate } from "@/helpers/a11y";
import React, { useState, useEffect, useRef } from "react";
import TreeNode from "./TreeNode";
import { TreeNode as TreeNodeType, TreeSelectProps } from "./types";

import { ArrowDown2, CloseCircle, SearchNormal } from "iconsax-react";
import { getDirection } from "@/Translation/i18n";
import i18next from "i18next";

const TreeSelect: React.FC<TreeSelectProps> = ({
  data,
  onSelect,
  multiSelect = false,
  value,
  canSelectParent = false,
  isLoading,
  placeholder,
  handleInputChange,
  inputSearchValue,
}) => {
  const [selectedNodes, setSelectedNodes] = useState<TreeNodeType[]>(
    Array.isArray(value) ? value : value ? [value] : []
  );
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = i18next;

  const handleNodeSelect = (node: TreeNodeType) => {
    if (multiSelect) {
      const newNodes = selectedNodes.some((n) => n.value === node.value)
        ? selectedNodes.filter((n) => n.value !== node.value)
        : [...selectedNodes, node];
      setSelectedNodes(newNodes);
      onSelect(newNodes);
    } else {
      setSelectedNodes([node]);
      onSelect(node);
      setIsOpen(false);
    }
  };

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRemoveNode = (node: TreeNodeType) => {
    const newNodes = selectedNodes.filter((n) => n.value !== node.value);
    setSelectedNodes(newNodes);
    onSelect(newNodes);
  };

  useEffect(() => {
    setSelectedNodes(Array.isArray(value) ? value : value ? [value] : []);
  }, [value]);

  return (
    <div ref={containerRef} className="relative ">
      <div role="button" tabIndex={0} onKeyDown={onKeyActivate}
        className={`px-4 py-2 border-[0.1rem]  ${
          !isOpen
            ? "border-gray-400 hover:border-gray-500"
            : "border-primary shadow-input-primary"
        } duration-200 rounded cursor-pointer relative`}
        onClick={toggleDropdown}
      >
        <div
          className={`flex items-center gap-2 opacity-35 absolute ${
            getDirection() === "rtl" ? "left-3" : "right-3"
          }`}
        >
          <CloseCircle
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNodes([]);
              onSelect([]);
            }}
            size={16}
            className="hover:text-gray-800 opacity-1 duration-500 text-gray-500 dark:text-gray-400"
          />
          |
          <ArrowDown2
            size={16}
            className="hover:text-gray-800 opacity-1 duration-500 text-gray-500 dark:text-gray-400"
          />
        </div>
        {selectedNodes.length > 0 ? (
          multiSelect ? (
            <ul className="flex flex-wrap items-center gap-2 pe-10">
              {selectedNodes.map((node, key) => (
                <li
                  key={`${node.id}-${key}`}
                  className="px-2 bg-gray-100 dark:bg-gray-800 rounded-md"
                >
                  {node.label}
                  <span role="button" tabIndex={0} onKeyDown={onKeyActivate}
                    className="text-red-500 hover:text-red-700 ms-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveNode(node);
                    }}
                  >
                    &times;
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <span>{selectedNodes[0]?.label}</span>
          )
        ) : (
          <span
            className={`${
              isLoading ? "animate-pulse" : ""
            } opacity-50 flex overflow-hidden text-wrap w-[85%]`}
          >
            {isLoading ? t("please_wait") : placeholder || t("select")}
          </span>
        )}
      </div>
      {isOpen && (
        <div className="absolute w-full max-h-[30vh] overflow-y-auto mt-2 p-4 border rounded bg-white dark:bg-card shadow-xl z-10">
          <div className="flex border-2 border-gray-200 dark:border-gray-700 text-sm items-center gap-2 w-full ps-4 py-2 rounded-sm mb-2">
            <SearchNormal size={16} />
            <input
              className="focus:outline-none w-full"
              value={inputSearchValue}
              onChange={handleInputChange}
              placeholder={t("search_for_item")}
            />
          </div>
          {!isLoading ? (
            data?.length > 0 ? (
              data.map((node, key) => (
                <TreeNode
                  key={`${node.id}-${key}`}
                  node={node}
                  onNodeSelect={handleNodeSelect}
                  selectedNodes={selectedNodes}
                  multiSelect={multiSelect}
                  canSelectParent={canSelectParent}
                />
              ))
            ) : (
              <span className="text-sm opacity-50 mt-2">{t("no_data")}</span>
            )
          ) : (
            <span className="text-sm opacity-50">{t("please_wait")}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default TreeSelect;
