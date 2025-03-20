import { Handle, Position } from "@xyflow/react";
import { Layout } from "lucide-react";
import { typeColors } from "../form-tree-view";
import { cn } from "@repo/ui/lib/utils";

interface PageNodeProps {
  data: {
    label: string;
    pageData: any;
  };
  selected: boolean;
}

export default function PageNode({ data, selected }: PageNodeProps) {
  return (
    <div
      className={cn(
        "p-3 rounded-md border-2 shadow-sm min-w-[150px]",
        typeColors.page.split(" ")[0], // Taking just the bg color without hover
        selected ? "border-primary " + typeColors.selected : "border-transparent",
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <div className="flex items-center gap-2">
        <Layout className="h-5 w-5 text-blue-500" />
        <div className="font-medium">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </div>
  );
}
