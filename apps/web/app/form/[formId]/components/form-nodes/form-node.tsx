import { Handle, Position } from "@xyflow/react";
import { FileText } from "lucide-react";
import { typeColors } from "../form-tree-view";
import { cn } from "@repo/ui/lib/utils";

interface FormNodeProps {
  data: {
    label: string;
    formData: any;
  };
  selected: boolean;
}

export default function FormNode({ data, selected }: FormNodeProps) {
  return (
    <div
      className={cn(
        "p-3 rounded-md border-2 shadow-sm min-w-[150px]",
        typeColors.form.split(" ")[0], // Taking just the bg color without hover
        selected ? "border-primary " + typeColors.selected : "border-transparent",
      )}
    >
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <div className="font-medium">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  );
}
