import React, { useState } from "react";
import { useFormBuilder } from "@/contexts/FormBuilderContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Edit, Trash2, MoveUp, MoveDown } from "lucide-react";
import { toast } from "sonner";
import { ElementDocument } from "@/lib/schemas";

interface ElementsListProps {
  pageId: string;
  elements: ElementDocument[];
}

// Define the type for element properties to avoid type errors
interface ElementProperties {
  placeholder?: string;
  [key: string]: any;
}

const ElementsList: React.FC<ElementsListProps> = ({ pageId, elements }) => {
  const { addElement, updateElement, deleteElement } = useFormBuilder();

  const [newElementDialogOpen, setNewElementDialogOpen] = useState(false);
  const [editElementDialogOpen, setEditElementDialogOpen] = useState(false);
  const [currentElement, setCurrentElement] = useState<ElementDocument | null>(
    null
  );

  // Form state for new/edit element
  const [elementType, setElementType] = useState<string>("text_input");
  const [elementLabel, setElementLabel] = useState("");
  const [elementRequired, setElementRequired] = useState(false);
  const [elementPlaceholder, setElementPlaceholder] = useState("");

  // Sort elements by order
  const sortedElements = [...elements].sort(
    (a, b) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) -
      (b.order ?? Number.MAX_SAFE_INTEGER)
  );

  const resetElementForm = () => {
    setElementType("text_input");
    setElementLabel("");
    setElementRequired(false);
    setElementPlaceholder("");
  };

  const handleAddElement = async () => {
    if (!elementLabel.trim()) {
      toast.error("Element label is required");
      return;
    }

    const newElement = await addElement(pageId, {
      type: elementType,
      label: elementLabel,
      required: elementRequired,
      properties: {
        placeholder: elementPlaceholder,
      },
    } as any);

    if (newElement) {
      toast.success("Element added successfully");
      setNewElementDialogOpen(false);
      resetElementForm();
    } else {
      toast.error("Failed to add element");
    }
  };

  const handleEditElement = async () => {
    if (!currentElement) return;

    if (!elementLabel.trim()) {
      toast.error("Element label is required");
      return;
    }

    const success = await updateElement(
      pageId,
      currentElement._id?.toString() ?? "",
      {
        type: elementType,
        label: elementLabel,
        required: elementRequired,
        properties: {
          ...((currentElement.properties as ElementProperties) || {}),
          placeholder: elementPlaceholder,
        },
      } as any
    );

    if (success) {
      toast.success("Element updated successfully");
      setEditElementDialogOpen(false);
      setCurrentElement(null);
      resetElementForm();
    } else {
      toast.error("Failed to update element");
    }
  };

  const handleDeleteElement = async (elementId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this element? This action cannot be undone."
      )
    ) {
      const success = await deleteElement(pageId, elementId);

      if (success) {
        toast.success("Element deleted successfully");
      } else {
        toast.error("Failed to delete element");
      }
    }
  };

  const handleMoveElementUp = async (element: ElementDocument) => {
    if ((element.order ?? 0) <= 1) return;

    const elementToSwap = sortedElements.find(
      (e) => (e.order ?? 0) === (element.order ?? 0) - 1
    );
    if (!elementToSwap) return;

    const success1 = await updateElement(
      pageId,
      element._id?.toString() ?? "",
      {
        order: (element.order ?? 0) - 1,
      } as any
    );

    const success2 = await updateElement(
      pageId,
      elementToSwap._id?.toString() ?? "",
      {
        order: (elementToSwap.order ?? 0) + 1,
      } as any
    );

    if (success1 && success2) {
      toast.success("Element moved up successfully");
    } else {
      toast.error("Failed to move element");
    }
  };

  const handleMoveElementDown = async (element: ElementDocument) => {
    if ((element.order ?? 0) >= sortedElements.length) return;

    const elementToSwap = sortedElements.find(
      (e) => (e.order ?? 0) === (element.order ?? 0) + 1
    );
    if (!elementToSwap) return;

    const success1 = await updateElement(
      pageId,
      element._id?.toString() ?? "",
      {
        order: (element.order ?? 0) + 1,
      } as any
    );

    const success2 = await updateElement(
      pageId,
      elementToSwap._id?.toString() ?? "",
      {
        order: (elementToSwap.order ?? 0) - 1,
      } as any
    );

    if (success1 && success2) {
      toast.success("Element moved down successfully");
    } else {
      toast.error("Failed to move element");
    }
  };

  const openEditElementDialog = (element: ElementDocument) => {
    setCurrentElement(element);
    setElementType(element.type ?? "text_input");
    setElementLabel(element.label ?? "");
    setElementRequired(element.required);

    // Fix the placeholder property access
    const properties = (element.properties as ElementProperties) || {};
    setElementPlaceholder(properties.placeholder || "");

    setEditElementDialogOpen(true);
  };

  const getElementTypeIcon = (type: string | undefined) => {
    if (!type) return "?";

    switch (type) {
      case "text_input":
        return "Aa";
      case "number_input":
        return "123";
      case "email":
        return "@";
      case "checkbox":
        return "☑";
      case "radio":
        return "○";
      case "select":
        return "▼";
      case "textarea":
        return "¶";
      case "date":
        return "📅";
      case "image":
        return "🖼️";
      case "text":
        return "T";
      default:
        return "?";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button onClick={() => setNewElementDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Element
        </Button>
      </div>

      <Dialog
        open={newElementDialogOpen}
        onOpenChange={setNewElementDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Element</DialogTitle>
            <DialogDescription>
              Add a new element to your form
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="element-type">Element Type</Label>
              <Select value={elementType} onValueChange={setElementType}>
                <SelectTrigger id="element-type">
                  <SelectValue placeholder="Select element type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text_input">Text Input</SelectItem>
                  <SelectItem value="number_input">Number Input</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="radio">Radio Buttons</SelectItem>
                  <SelectItem value="select">Dropdown</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                  <SelectItem value="date">Date Picker</SelectItem>
                  <SelectItem value="text">Text Block</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="element-label">Label</Label>
              <Input
                id="element-label"
                value={elementLabel}
                onChange={(e) => setElementLabel(e.target.value)}
                placeholder="Enter element label"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="element-required"
                checked={elementRequired}
                onCheckedChange={setElementRequired}
              />
              <Label htmlFor="element-required">Required field</Label>
            </div>

            {["text_input", "number_input", "email", "textarea"].includes(
              elementType
            ) && (
              <div className="grid gap-2">
                <Label htmlFor="element-placeholder">
                  Placeholder Text (Optional)
                </Label>
                <Input
                  id="element-placeholder"
                  value={elementPlaceholder}
                  onChange={(e) => setElementPlaceholder(e.target.value)}
                  placeholder="Enter placeholder text"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewElementDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddElement}>Add Element</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editElementDialogOpen}
        onOpenChange={setEditElementDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Element</DialogTitle>
            <DialogDescription>Update element properties</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-element-type">Element Type</Label>
              <Select value={elementType} onValueChange={setElementType}>
                <SelectTrigger id="edit-element-type">
                  <SelectValue placeholder="Select element type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text_input">Text Input</SelectItem>
                  <SelectItem value="number_input">Number Input</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="radio">Radio Buttons</SelectItem>
                  <SelectItem value="select">Dropdown</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                  <SelectItem value="date">Date Picker</SelectItem>
                  <SelectItem value="text">Text Block</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-element-label">Label</Label>
              <Input
                id="edit-element-label"
                value={elementLabel}
                onChange={(e) => setElementLabel(e.target.value)}
                placeholder="Enter element label"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-element-required"
                checked={elementRequired}
                onCheckedChange={setElementRequired}
              />
              <Label htmlFor="edit-element-required">Required field</Label>
            </div>

            {["text_input", "number_input", "email", "textarea"].includes(
              elementType
            ) && (
              <div className="grid gap-2">
                <Label htmlFor="edit-element-placeholder">
                  Placeholder Text (Optional)
                </Label>
                <Input
                  id="edit-element-placeholder"
                  value={elementPlaceholder}
                  onChange={(e) => setElementPlaceholder(e.target.value)}
                  placeholder="Enter placeholder text"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditElementDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditElement}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {sortedElements.length === 0 ? (
        <div className="text-center p-6 border border-dashed rounded-md">
          <p className="text-gray-500 mb-4">
            No elements on this page yet. Add your first element to get started.
          </p>
          <Button onClick={() => setNewElementDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add First Element
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedElements.map((element) => (
            <Card key={element._id?.toString() ?? "unknown"}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md font-mono text-sm">
                      {getElementTypeIcon(element.type)}
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {element.label || "Untitled"}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {element.type
                          ? element.type.replace("_", " ")
                          : "Unknown type"}
                        {element.required && " • Required"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveElementUp(element)}
                      disabled={(element.order ?? 0) <= 1}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveElementDown(element)}
                      disabled={(element.order ?? 0) >= sortedElements.length}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditElementDialog(element)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleDeleteElement(element._id?.toString() ?? "")
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ElementsList;
