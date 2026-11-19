export interface TreeNode {
  id: string;
  label: string;
  value: string | boolean | number;
  children?: TreeNode[];
}

export interface TreeSelectProps {
  data: TreeNode[];
  onSelect: (nodes: TreeNode[] | TreeNode) => void;
  multiSelect?: boolean;
  value: TreeNode[] | any[];
  canSelectParent?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  handleInputChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  inputSearchValue?: string;
}
