import { Handle, Position } from "reactflow"
import { FormInput, CheckSquare, ListFilter, Calendar, Mail, Type, ImageIcon, AlignLeft } from "lucide-react"

interface ElementNodeProps {
  data: {
    label: string
    elementData: any
    elementType: string
    required: boolean
  }
  selected: boolean
}

export default function ElementNode({ data, selected }: ElementNodeProps) {
  // Get element icon based on type
  const getElementIcon = () => {
    switch (data.elementType) {
      case "text_input":
        return <Type className="h-5 w-5 text-gray-600" />
      case "number_input":
        return <FormInput className="h-5 w-5 text-gray-600" />
      case "email":
        return <Mail className="h-5 w-5 text-gray-600" />
      case "checkbox":
        return <CheckSquare className="h-5 w-5 text-gray-600" />
      case "radio":
        return <ListFilter className="h-5 w-5 text-gray-600" />
      case "select":
        return <ListFilter className="h-5 w-5 text-gray-600" />
      case "textarea":
        return <AlignLeft className="h-5 w-5 text-gray-600" />
      case "image":
        return <ImageIcon className="h-5 w-5 text-gray-600" />
      case "date":
        return <Calendar className="h-5 w-5 text-gray-600" />
      default:
        return <FormInput className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div
      className={`p-3 rounded-md border-2 ${selected ? "border-primary" : "border-border"} bg-background shadow-sm min-w-[150px]`}
    >
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <div className="flex items-center gap-2">
        {getElementIcon()}
        <div className="font-medium">
          {data.label}
          {data.required && <span className="text-red-500 ml-1">*</span>}
        </div>
      </div>
    </div>
  )
}

