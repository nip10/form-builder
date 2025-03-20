import { Handle, Position } from "@xyflow/react";
import { Folder } from "lucide-react";
import { typeColors } from "../form-tree-view";
import { cn } from "@repo/ui/lib/utils";

interface GroupNodeProps {
  data: {
    label: string;
    groupData: any;
  };
  selected: boolean;
}

export default function GroupNode({ data, selected }: GroupNodeProps) {
  return (
    <div
      className={cn(
        "p-3 rounded-md border-2 shadow-sm min-w-[150px]",
        typeColors.group.split(" ")[0], // Taking just the bg color without hover
        selected ? "border-primary " + typeColors.selected : "border-transparent",
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="flex items-center gap-2">
        <Folder className="h-5 w-5 text-orange-500" />
        <div className="font-medium">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </div>
  );
}
