import React, { useState, useEffect } from "react";
import { useFormBuilder } from "@/contexts/FormBuilderContext";
import {
  ConditionDocument,
  ElementDocument,
  PageDocument,
  GroupDocument,
} from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, Edit, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ObjectId } from "bson";
import { FormWithValidations } from "@/types/form";

/**
 * ConditionalLogicEditor Component
 *
 * This component handles conditional logic for forms, allowing users to create
 * rules that show/hide elements based on form responses.
 *
 * IMPORTANT: This component is designed to work with MongoDB's document model where
 * relationships are represented by ObjectId references rather than embedded documents.
 *
 * To use this component properly:
 * 1. You must provide the form document
 * 2. You should also provide the actual loaded documents for pages, groups, elements, and conditions
 *    that are referenced by ObjectIds in the form document
 *
 * If you don't provide the loaded documents, the component will try to use the references
 * in the form document, but this may cause type errors since ObjectIds don't have the properties
 * that the actual documents have.
 */
interface ConditionalLogicEditorProps {
  form: FormWithValidations;
  // Add loaded data from the database
  loadedPages?: PageDocument[];
  loadedGroups?: GroupDocument[];
  loadedElements?: ElementDocument[];
  loadedConditions?: ConditionDocument[];
}

// Helper to get all usable source elements (elements that can trigger conditions)
const getSourceElements = (elements: ElementDocument[]): ElementDocument[] => {
  const sourceTypes = [
    "text_input",
    "number_input",
    "email",
    "checkbox",
    "radio",
    "select",
    "date",
  ];

  return elements.filter((element) =>
    sourceTypes.includes(element.type as string)
  );
};

// Helper to get all potential targets (pages, groups, elements) for conditions
const getTargetElements = (
  pages: PageDocument[],
  groups: GroupDocument[],
  elements: ElementDocument[]
): { id: string; type: "page" | "element" | "group"; label: string }[] => {
  const targets: {
    id: string;
    type: "page" | "element" | "group";
    label: string;
  }[] = [];

  // Add pages
  pages.forEach((page) => {
    if (page._id) {
      targets.push({
        id: page._id.toString(),
        type: "page",
        label: `Page: ${(page as any).title || "Untitled"}`,
      });
    }
  });

  // Add groups
  groups.forEach((group) => {
    if (group._id) {
      targets.push({
        id: group._id.toString(),
        type: "group",
        label: `Group: ${(group as any).title || "Untitled"}`,
      });
    }
  });

  // Add elements
  elements.forEach((element) => {
    if (element._id) {
      // Find the page this element belongs to
      const page = pages.find((p) => {
        if (!p.element_instances) return false;
        return p.element_instances.some((eId) => {
          if (!eId) return false;
          return eId.toString() === element._id!.toString();
        });
      });

      targets.push({
        id: element._id.toString(),
        type: "element",
        label: `Element: ${element.label || "Untitled"} ${
          page ? `(${(page as any).title || "Untitled"})` : ""
        }`,
      });
    }
  });

  return targets;
};

const ConditionalLogicEditor: React.FC<ConditionalLogicEditorProps> = ({
  form,
  loadedPages = [],
  loadedGroups = [],
  loadedElements = [],
  loadedConditions = [],
}) => {
  const { addCondition, updateCondition, deleteCondition } = useFormBuilder();

  // State for loaded data
  const [pages, setPages] = useState<PageDocument[]>(loadedPages);
  const [groups, setGroups] = useState<GroupDocument[]>(loadedGroups);
  const [elements, setElements] = useState<ElementDocument[]>(loadedElements);
  const [conditions, setConditions] =
    useState<ConditionDocument[]>(loadedConditions);

  const [newConditionDialogOpen, setNewConditionDialogOpen] = useState(false);
  const [editConditionDialogOpen, setEditConditionDialogOpen] = useState(false);
  const [currentCondition, setCurrentCondition] =
    useState<ConditionDocument | null>(null);

  // Form state for new/edit condition
  const [sourceElementId, setSourceElementId] = useState("");
  const [operator, setOperator] = useState<
    "equals" | "not_equals" | "contains" | "greater_than" | "less_than"
  >("equals");
  const [conditionValue, setConditionValue] = useState("");
  const [action, setAction] = useState<"show" | "hide">("show");
  const [targetId, setTargetId] = useState("");
  const [targetType, setTargetType] = useState<"page" | "element" | "group">(
    "page"
  );

  // Load data if not provided as props
  useEffect(() => {
    // This would be where you'd fetch the data if not provided as props
    // For now, we'll use what's provided
    if (loadedPages.length > 0) setPages(loadedPages);
    if (loadedGroups.length > 0) setGroups(loadedGroups);
    if (loadedElements.length > 0) setElements(loadedElements);
    if (loadedConditions.length > 0) {
      setConditions(loadedConditions);
    } else if (form.conditions) {
      // If conditions are available in the form prop, use those
      setConditions(form.conditions as unknown as ConditionDocument[]);
    }
  }, [
    loadedPages,
    loadedGroups,
    loadedElements,
    loadedConditions,
    form.conditions,
  ]);

  const sourceElements = getSourceElements(elements);
  const targetElements = getTargetElements(pages, groups, elements);

  const resetConditionForm = () => {
    setSourceElementId("");
    setOperator("equals");
    setConditionValue("");
    setAction("show");
    setTargetId("");
    setTargetType("page");
  };

  const handleAddCondition = async () => {
    if (!sourceElementId || !conditionValue || !targetId) {
      toast.error("All fields are required");
      return;
    }

    const conditionData = {
      source_element_id: new ObjectId(sourceElementId),
      operator,
      value: conditionValue,
      action,
      target_id: new ObjectId(targetId),
      target_type: targetType,
    };

    const success = await addCondition(conditionData);

    if (success) {
      toast.success("Condition added successfully");
      setNewConditionDialogOpen(false);
      resetConditionForm();

      // The form will be reloaded by the context, no need to update local state here
    } else {
      toast.error("Failed to add condition");
    }
  };

  const handleEditCondition = async () => {
    if (!currentCondition || !currentCondition._id) return;

    if (!sourceElementId || !conditionValue || !targetId) {
      toast.error("All fields are required");
      return;
    }

    const success = await updateCondition(currentCondition._id.toString(), {
      source_element_id: new ObjectId(sourceElementId),
      operator,
      value: conditionValue,
      action,
      target_id: new ObjectId(targetId),
      target_type: targetType,
    });

    if (success) {
      toast.success("Condition updated successfully");
      setEditConditionDialogOpen(false);
      setCurrentCondition(null);
      resetConditionForm();

      // Update local state
      const updatedConditions = conditions.map((c) =>
        c._id?.toString() === currentCondition._id.toString()
          ? {
              ...c,
              source_element_id: new ObjectId(sourceElementId),
              operator,
              value: conditionValue,
              action,
              target_id: new ObjectId(targetId),
              target_type: targetType,
            }
          : c
      );
      setConditions(updatedConditions);
    } else {
      toast.error("Failed to update condition");
    }
  };

  const handleDeleteCondition = async (conditionId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this condition? This action cannot be undone."
      )
    ) {
      const success = await deleteCondition(conditionId);

      if (success) {
        toast.success("Condition deleted successfully");

        // Update local state
        setConditions(
          conditions.filter((c) => c._id?.toString() !== conditionId)
        );
      } else {
        toast.error("Failed to delete condition");
      }
    }
  };

  const openEditConditionDialog = (condition: ConditionDocument) => {
    setCurrentCondition(condition);
    if (condition.source_element_id) {
      setSourceElementId(condition.source_element_id.toString());
    }
    if (condition.operator) {
      setOperator(
        condition.operator as
          | "equals"
          | "not_equals"
          | "contains"
          | "greater_than"
          | "less_than"
      );
    }
    setConditionValue(condition.value || "");
    if (condition.action) {
      setAction(condition.action as "show" | "hide");
    }
    if (condition.target_id) {
      setTargetId(condition.target_id.toString());
    }
    if (condition.target_type) {
      setTargetType(condition.target_type as "page" | "element" | "group");
    }
    setEditConditionDialogOpen(true);
  };

  // Helper to find element by ID
  const getElementById = (elementId: string): ElementDocument | null => {
    return elements.find((e) => e._id?.toString() === elementId) || null;
  };

  // Helper to get friendly names for condition display
  const getConditionDescription = (condition: ConditionDocument) => {
    if (!condition.source_element_id) return "Unknown condition";

    const sourceElement = getElementById(
      condition.source_element_id.toString()
    );
    if (!sourceElement) return "Unknown condition";

    let targetDescription = "Unknown target";

    if (condition.target_type === "page" && condition.target_id) {
      const page = pages.find(
        (p) => p._id?.toString() === condition.target_id?.toString()
      );
      if (page)
        targetDescription = `Page: ${(page as any).title || "Untitled"}`;
    } else if (condition.target_type === "group" && condition.target_id) {
      const group = groups.find(
        (g) => g._id?.toString() === condition.target_id?.toString()
      );
      if (group)
        targetDescription = `Group: ${(group as any).title || "Untitled"}`;
    } else if (condition.target_type === "element" && condition.target_id) {
      const element = getElementById(condition.target_id.toString());
      if (element)
        targetDescription = `Element: ${element.label || "Untitled"}`;
    }

    const operatorMap: Record<string, string> = {
      equals: "equals",
      not_equals: "does not equal",
      contains: "contains",
      greater_than: "is greater than",
      less_than: "is less than",
    };

    const operatorText = condition.operator
      ? operatorMap[condition.operator as string]
      : "equals";
    const actionText = condition.action === "show" ? "show" : "hide";

    return (
      <div className="flex flex-wrap items-center gap-1">
        <span className="font-medium">{sourceElement.label}</span>
        <span>{operatorText}</span>
        <span className="font-medium">&apos;{condition.value}&apos;</span>
        <ArrowRight className="h-3 w-3 mx-1" />
        <span>{actionText}</span>
        <span className="font-medium">{targetDescription}</span>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Conditional Logic</h2>

        <Dialog
          open={newConditionDialogOpen}
          onOpenChange={setNewConditionDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Condition
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Condition</DialogTitle>
              <DialogDescription>
                Create a condition to show or hide elements based on responses
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="source-element">If this field</Label>
                <Select
                  value={sourceElementId}
                  onValueChange={setSourceElementId}
                >
                  <SelectTrigger id="source-element">
                    <SelectValue placeholder="Select a field" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceElements.map(
                      (element) =>
                        element._id && (
                          <SelectItem
                            key={element._id.toString()}
                            value={element._id.toString()}
                          >
                            {element.label}
                          </SelectItem>
                        )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="operator">Operator</Label>
                <Select
                  value={operator}
                  onValueChange={(value: any) => setOperator(value)}
                >
                  <SelectTrigger id="operator">
                    <SelectValue placeholder="Select an operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Does not equal</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="greater_than">Greater than</SelectItem>
                    <SelectItem value="less_than">Less than</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="condition-value">Value</Label>
                <Input
                  id="condition-value"
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  placeholder="Enter comparison value"
                />
              </div>

              <div className="grid gap-2">
                <Label>Action</Label>
                <RadioGroup
                  value={action}
                  onValueChange={(value: any) => setAction(value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="show" id="action-show" />
                    <Label htmlFor="action-show">Show</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hide" id="action-hide" />
                    <Label htmlFor="action-hide">Hide</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="target-type">Target Type</Label>
                <Select
                  value={targetType}
                  onValueChange={(value: any) => setTargetType(value)}
                >
                  <SelectTrigger id="target-type">
                    <SelectValue placeholder="Select target type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page">Page</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="element">Element</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="target">Target</Label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger id="target">
                    <SelectValue placeholder="Select a target" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetElements
                      .filter((target) => target.type === targetType)
                      .map((target) => (
                        <SelectItem key={target.id} value={target.id}>
                          {target.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setNewConditionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddCondition}>Add Condition</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={editConditionDialogOpen}
          onOpenChange={setEditConditionDialogOpen}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Condition</DialogTitle>
              <DialogDescription>Update conditional logic</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-source-element">If this field</Label>
                <Select
                  value={sourceElementId}
                  onValueChange={setSourceElementId}
                >
                  <SelectTrigger id="edit-source-element">
                    <SelectValue placeholder="Select a field" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceElements.map(
                      (element) =>
                        element._id && (
                          <SelectItem
                            key={element._id.toString()}
                            value={element._id.toString()}
                          >
                            {element.label}
                          </SelectItem>
                        )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-operator">Operator</Label>
                <Select
                  value={operator}
                  onValueChange={(value: any) => setOperator(value)}
                >
                  <SelectTrigger id="edit-operator">
                    <SelectValue placeholder="Select an operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Does not equal</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="greater_than">Greater than</SelectItem>
                    <SelectItem value="less_than">Less than</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-condition-value">Value</Label>
                <Input
                  id="edit-condition-value"
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  placeholder="Enter comparison value"
                />
              </div>

              <div className="grid gap-2">
                <Label>Action</Label>
                <RadioGroup
                  value={action}
                  onValueChange={(value: any) => setAction(value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="show" id="edit-action-show" />
                    <Label htmlFor="edit-action-show">Show</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hide" id="edit-action-hide" />
                    <Label htmlFor="edit-action-hide">Hide</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-target-type">Target Type</Label>
                <Select
                  value={targetType}
                  onValueChange={(value: any) => setTargetType(value)}
                >
                  <SelectTrigger id="edit-target-type">
                    <SelectValue placeholder="Select target type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page">Page</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="element">Element</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-target">Target</Label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger id="edit-target">
                    <SelectValue placeholder="Select a target" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetElements
                      .filter((target) => target.type === targetType)
                      .map((target) => (
                        <SelectItem key={target.id} value={target.id}>
                          {target.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditConditionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditCondition}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {conditions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-6">
              <p className="text-gray-500 mb-4">
                No conditions yet. Add conditional logic to make your form
                dynamic.
              </p>
              <Button onClick={() => setNewConditionDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add First Condition
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conditions.map(
            (condition) =>
              condition._id && (
                <Card key={condition._id.toString()}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {getConditionDescription(condition)}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditConditionDialog(condition)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            condition._id &&
                            handleDeleteCondition(condition._id.toString())
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
          )}
        </div>
      )}
    </div>
  );
};

export default ConditionalLogicEditor;
