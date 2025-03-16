import { Handle, Position } from "reactflow"
import { Folder } from "lucide-react"

interface GroupNodeProps {
  data: {
    label: string
    groupData: any
  }
  selected: boolean
}

export default function GroupNode({ data, selected }: GroupNodeProps) {
  return (
    <div
      className={`p-3 rounded-md border-2 ${selected ? "border-primary" : "border-border"} bg-background shadow-sm min-w-[150px]`}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="flex items-center gap-2">
        <Folder className="h-5 w-5 text-orange-500" />
        <div className="font-medium">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </div>
  )
}

