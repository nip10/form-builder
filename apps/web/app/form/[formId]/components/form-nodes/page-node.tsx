import { Handle, Position } from "reactflow";
import { Layout } from "lucide-react";

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
      className={`p-3 rounded-md border-2 ${selected ? "border-primary" : "border-border"} bg-background shadow-sm min-w-[150px]`}
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
