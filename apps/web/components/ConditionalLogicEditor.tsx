import React, { useState, useEffect } from "react";
import { useFormBuilder } from "@/contexts/FormBuilderContext";
import {
  Condition,
  ElementInstance,
  ElementTemplate,
  PageInstance,
  GroupInstance,
  Form
} from "@repo/database/src/schema";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/ui/radio-group";
import { PlusCircle, Edit, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

/**
 * ConditionalLogicEditor Component
 *
 * This component handles conditional logic for forms, allowing users to create
 * rules that show/hide elements based on form responses.
 *
 * IMPORTANT: This component is designed to work with SQL database model where
 * relationships are represented by foreign keys.
 *
 * To use this component properly:
 * 1. You must provide the form document with its relations
 * 2. You should also provide the actual loaded instances for pages, groups, elements, and conditions
 *    that are related to the form
 */

// Define the FormWithRelations type
interface FormWithRelations extends Form {
  groups: (GroupInstance & {
    pages?: (PageInstance & {
      elements?: (ElementInstance & {
        template?: ElementTemplate;
      })[];
    })[];
  })[];
  pages: (PageInstance & {
    elements?: (ElementInstance & {
      template?: ElementTemplate;
    })[];
  })[];
  validations?: any[];
  conditions?: Condition[];
}

interface ConditionalLogicEditorProps {
  form: FormWithRelations;
  // Add loaded data from the database
  loadedPages?: PageInstance[];
  loadedGroups?: GroupInstance[];
  loadedElements?: (ElementInstance & { template?: ElementTemplate })[];
  loadedConditions?: Condition[];
}

// Define a custom type for source elements with template
type ElementWithTemplate = ElementInstance & { template?: ElementTemplate };

// Define a custom interface for the condition data with sourceElementId
interface ConditionWithSourceElement extends Condition {
  sourceElementId?: number;
}

// Helper to get all usable source elements (elements that can trigger conditions)
const getSourceElements = (elements: ElementWithTemplate[]): ElementWithTemplate[] => {
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
    sourceTypes.includes(element.template?.type as string)
  );
};

// Helper to get all potential targets (pages, groups, elements) for conditions
const getTargetElements = (
  pages: PageInstance[],
  groups: GroupInstance[],
  elements: ElementWithTemplate[]
): { id: string; type: "page" | "element" | "group"; label: string }[] => {
  const targets: {
    id: string;
    type: "page" | "element" | "group";
    label: string;
  }[] = [];

  // Add pages as targets
  pages.forEach((page) => {
    targets.push({
      id: page.id.toString(),
      type: "page",
      label: `Page: ${page.titleOverride || "Untitled"}`,
    });
  });

  // Add groups as targets
  groups.forEach((group) => {
    targets.push({
      id: group.id.toString(),
      type: "group",
      label: `Group: ${group.titleOverride || "Untitled"}`,
    });
  });

  // Add elements as targets
  elements.forEach((element) => {
    // Find the page this element belongs to
    const page = pages.find((p) => {
      return p.id === element.pageInstanceId;
    });

    targets.push({
      id: element.id.toString(),
      type: "element",
      label: `Element: ${element.template?.label || "Untitled"} ${
        page ? `(${page.titleOverride || "Untitled"})` : ""
      }`,
    });
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
  const [pages, setPages] = useState<PageInstance[]>(loadedPages);
  const [groups, setGroups] = useState<GroupInstance[]>(loadedGroups);
  const [elements, setElements] = useState<ElementInstance[]>(loadedElements);
  const [conditions, setConditions] =
    useState<Condition[]>(loadedConditions);

  const [newConditionDialogOpen, setNewConditionDialogOpen] = useState(false);
  const [editConditionDialogOpen, setEditConditionDialogOpen] = useState(false);
  const [currentCondition, setCurrentCondition] =
    useState<Condition | null>(null);

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
      setConditions(form.conditions as unknown as Condition[]);
    }
  }, [
    loadedPages,
    loadedGroups,
    loadedElements,
    loadedConditions,
    form.conditions,
  ]);

  const sourceElements = getSourceElements(elements as ElementWithTemplate[]);
  const targetElements = getTargetElements(pages, groups, elements as ElementWithTemplate[]);

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

    const parsedRule = operator;

    const newCondition = await addCondition({
      name: conditionValue,
      rule: parsedRule,
      action: action as "show" | "hide",
      targetType: targetType as "element" | "page" | "group",
      targetId: parseInt(targetId, 10),
      sourceElementId: parseInt(sourceElementId, 10),
    });

    if (newCondition) {
      toast.success("Condition added successfully");
      setNewConditionDialogOpen(false);
      resetConditionForm();

      // The form will be reloaded by the context, no need to update local state here
    } else {
      toast.error("Failed to add condition");
    }
  };

  const handleEditCondition = async () => {
    if (!currentCondition || !currentCondition.id) return;

    if (!sourceElementId || !conditionValue || !targetId) {
      toast.error("All fields are required");
      return;
    }

    const parsedRule = operator;

    // Create an object with only the properties that exist in the Condition type
    const updates: Partial<Condition> = {
      name: conditionValue,
      rule: parsedRule,
      action: action as "show" | "hide",
      targetType: targetType as "element" | "page" | "group",
      targetId: parseInt(targetId, 10),
    };

    // Add sourceElementId separately since it's not in the Condition type
    const fullUpdates = {
      ...updates,
      sourceElementId: parseInt(sourceElementId, 10),
    };

    const success = await updateCondition(
      parseInt(currentCondition.id.toString(), 10),
      fullUpdates as any // Use type assertion since we know the API accepts this
    );

    if (success) {
      toast.success("Condition updated successfully");
      setEditConditionDialogOpen(false);
      setCurrentCondition(null);
      resetConditionForm();

      // Update local state
      const updatedConditions = conditions.map((c) =>
        c.id?.toString() === currentCondition.id.toString()
          ? {
              ...c,
              name: conditionValue,
              rule: parsedRule,
              action: action as "show" | "hide",
              targetType: targetType as "element" | "page" | "group",
              targetId: parseInt(targetId, 10),
              sourceElementId: parseInt(sourceElementId, 10),
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
      const success = await deleteCondition(parseInt(conditionId, 10));

      if (success) {
        toast.success("Condition deleted successfully");

        // Update local state
        setConditions(
          conditions.filter((c) => c.id?.toString() !== conditionId)
        );
      } else {
        toast.error("Failed to delete condition");
      }
    }
  };

  const openEditConditionDialog = (condition: Condition) => {
    setCurrentCondition(condition);
    // Use sourceElementId from the condition if it exists
    const sourceId = (condition as any).sourceElementId;
    if (sourceId) {
      setSourceElementId(sourceId.toString());
    }
    if (condition.rule) {
      setOperator(
        condition.rule as
          | "equals"
          | "not_equals"
          | "contains"
          | "greater_than"
          | "less_than"
      );
    }
    setConditionValue(condition.name || "");
    if (condition.action) {
      setAction(condition.action as "show" | "hide");
    }
    if (condition.targetId) {
      setTargetId(condition.targetId.toString());
    }
    if (condition.targetType) {
      setTargetType(condition.targetType as "page" | "element" | "group");
    }
    setEditConditionDialogOpen(true);
  };

  // Helper to find element by ID
  const getElementById = (elementId: string): ElementWithTemplate | null => {
    return elements.find((e) => e.id?.toString() === elementId) as ElementWithTemplate || null;
  };

  // Helper to get friendly names for condition display
  const getConditionDescription = (condition: ConditionWithSourceElement) => {
    if (!condition.sourceElementId) return "Unknown condition";

    const sourceElement = getElementById(condition.sourceElementId.toString());
    if (!sourceElement) return "Unknown condition";

    let targetDescription = "Unknown target";

    if (condition.targetType === "page" && condition.targetId) {
      const page = pages.find(
        (p) => p.id?.toString() === condition.targetId?.toString()
      );
      if (page)
        targetDescription = `Page: ${(page as any).titleOverride || "Untitled"}`;
    } else if (condition.targetType === "group" && condition.targetId) {
      const group = groups.find(
        (g) => g.id?.toString() === condition.targetId?.toString()
      );
      if (group)
        targetDescription = `Group: ${(group as any).titleOverride || "Untitled"}`;
    } else if (condition.targetType === "element" && condition.targetId) {
      const element = getElementById(condition.targetId.toString());
      if (element)
        targetDescription = `Element: ${element.template?.label || "Untitled"}`;
    }

    const operatorMap: Record<string, string> = {
      equals: "equals",
      not_equals: "does not equal",
      contains: "contains",
      greater_than: "is greater than",
      less_than: "is less than",
    };

    const operatorText = condition.rule
      ? operatorMap[condition.rule as string]
      : "equals";
    const actionText = condition.action === "show" ? "show" : "hide";

    return (
      <div className="flex flex-wrap items-center gap-1">
        <span className="font-medium">{sourceElement.labelOverride || (sourceElement.template?.label || "Unknown")}</span>
        <span>{operatorText}</span>
        <span className="font-medium">&apos;{condition.name}&apos;</span>
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
                        element.id && (
                          <SelectItem
                            key={element.id.toString()}
                            value={element.id.toString()}
                          >
                            {element.labelOverride || (element.template?.label || "Unknown")}
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
                        element.id && (
                          <SelectItem
                            key={element.id.toString()}
                            value={element.id.toString()}
                          >
                            {element.labelOverride || (element.template?.label || "Unknown")}
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
              condition.id && (
                <Card key={condition.id.toString()}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {getConditionDescription(condition as ConditionWithSourceElement)}
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
                            condition.id &&
                            handleDeleteCondition(condition.id.toString())
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
