import { Handle, Position } from "reactflow"
import { FileText } from "lucide-react"

interface FormNodeProps {
  data: {
    label: string
    formData: any
  }
  selected: boolean
}

export default function FormNode({ data, selected }: FormNodeProps) {
  return (
    <div
      className={`p-3 rounded-md border-2 ${selected ? "border-primary" : "border-border"} bg-background shadow-sm min-w-[150px]`}
    >
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <div className="font-medium">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  )
}

