import { onKeyActivate } from "@/helpers/a11y";
import React, { useState } from "react";
import { TreeNode as TreeNodeType } from "./types";

import { Checkbox } from "@/components/ui/checkbox";
import { getDirection } from "@/Translation/i18n";
import { ArrowLeft2, ArrowRight2 } from "iconsax-react";

interface TreeNodeProps {
  node: TreeNodeType;
  onNodeSelect: (node: TreeNodeType) => void;
  selectedNodes: TreeNodeType[];
  multiSelect: boolean;
  canSelectParent?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  onNodeSelect,
  selectedNodes,
  multiSelect,
  canSelectParent,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpand = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const isSelected = selectedNodes?.some(
    (selectedNode) => selectedNode.value === node.value
  );
  const canSelect = node.children?.length ? canSelectParent : true;

  const handleNodeClick = () => {
    if (node.children?.length) {
      setExpanded(!expanded);
    }
    if (canSelect) {
      onNodeSelect(node);
    }
  };

  return (
    <div className="ml-4 mt-1">
      <div className="flex items-center gap-2">
        {node.children && (
          <span role="button" tabIndex={0} onKeyDown={onKeyActivate}
            className="p-2 py-0 rounded-sm hover:bg-slate-100 hover:text-primary"
            onClick={handleExpand}
          >
            {getDirection() === "rtl" ? (
              <ArrowLeft2
                strokeWidth={1}
                size={16}
                className={`duration-300 cursor-pointer ${
                  expanded ? "-rotate-90" : ""
                }`}
              />
            ) : (
              <ArrowRight2
                strokeWidth={1}
                size={16}
                className={`duration-300 cursor-pointer ${
                  expanded ? "rotate-90" : ""
                }`}
              />
            )}
          </span>
        )}
        {canSelect && multiSelect && (
          <Checkbox checked={isSelected} onCheckedChange={handleNodeClick} />
        )}
        <span role="button" tabIndex={0} onKeyDown={onKeyActivate}
          className={`w-full hover:bg-primary/10 hover:text-black p-1 rounded-sm cursor-pointer text-sm ${
            canSelect
              ? isSelected && multiSelect
                ? "text-primary font-semibold"
                : isSelected && !multiSelect
                  ? "bg-primary text-white"
                  : ""
              : "cursor-default"
          }`}
          onClick={handleNodeClick}
        >
          {node.label}
        </span>
      </div>
      {expanded && node.children && (
        <div className="ms-9 my-1 px-4">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onNodeSelect={onNodeSelect}
              selectedNodes={selectedNodes}
              multiSelect={multiSelect}
              canSelectParent={canSelectParent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;
