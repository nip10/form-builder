import { useFormBuilder } from "@/contexts/FormBuilderContext";
import {
  FormValidation,
  ElementInstance,
  Form,
  GroupInstance,
  PageInstance,
  ElementTemplate
} from "@repo/database/src/schema";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
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
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { PlusCircle, Edit, Trash2, Code, Info } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import { useState } from "react";

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
  validations?: FormValidation[];
  conditions?: any[];
}

// Helper to convert string IDs to numbers
const toNumberId = (id: string): number => {
  return parseInt(id, 10);
};

// Helper to flatten all elements from all pages
const getAllElements = (form: FormWithRelations): (ElementInstance & { template?: ElementTemplate })[] => {
  const allElements: (ElementInstance & { template?: ElementTemplate })[] = [];
  if (form.pages) {
    form.pages.forEach((page: PageInstance & {
      elements?: (ElementInstance & { template?: ElementTemplate })[]
    }) => {
      if (page.elements) {
        page.elements.forEach((element: ElementInstance & { template?: ElementTemplate }) => {
          allElements.push(element);
        });
      }
    });
  }
  return allElements;
};

interface ValidationRulesEditorProps {
  form: FormWithRelations;
}

const ValidationRulesEditor: React.FC<ValidationRulesEditorProps> = ({
  form,
}) => {
  const { addFormValidation, updateFormValidation, deleteFormValidation } =
    useFormBuilder();

  const [newValidationDialogOpen, setNewValidationDialogOpen] = useState(false);
  const [editValidationDialogOpen, setEditValidationDialogOpen] =
    useState(false);
  const [currentValidation, setCurrentValidation] =
    useState<FormValidation | null>(null);

  // Form state for new/edit validation
  const [validationName, setValidationName] = useState("");
  const [validationRule, setValidationRule] = useState("");
  const [validationErrorMessage, setValidationErrorMessage] = useState("");
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [ruleTemplate, setRuleTemplate] = useState("");

  const allElements = getAllElements(form);

  const resetValidationForm = () => {
    setValidationName("");
    setValidationRule("");
    setValidationErrorMessage("");
    setSelectedElements([]);
    setRuleTemplate("");
  };

  const applyRuleTemplate = () => {
    let newRule = "";

    switch (ruleTemplate) {
      case "sum_equals":
        newRule = `{
  "==": [
    { "+": [${selectedElements.map((id) => `{ "var": "${id}" }`).join(", ")}] },
    100
  ]
}`;
        break;

      case "all_required_if":
        if (selectedElements.length >= 2) {
          const condition = selectedElements[0];
          const dependentFields = selectedElements.slice(1);

          newRule = `{
  "if": [
    { "==": [{ "var": "${condition}" }, true] },
    { "and": [${dependentFields
      .map((id) => `{ "!!": { "var": "${id}" } }`)
      .join(", ")}] },
    true
  ]
}`;
        }
        break;

      case "min_max_comparison":
        if (selectedElements.length >= 2) {
          newRule = `{
  "<=": [
    { "var": "${selectedElements[0]}" },
    { "var": "${selectedElements[1]}" }
  ]
}`;
        }
        break;

      case "custom":
        // Keep current rule for custom option
        break;
    }

    if (newRule) {
      setValidationRule(newRule);
    }
  };

  const handleAddValidation = async () => {
    if (
      !validationName.trim() ||
      !validationRule.trim() ||
      !validationErrorMessage.trim() ||
      selectedElements.length === 0
    ) {
      toast.error("All fields are required to create a validation rule");
      return;
    }

    try {
      // Parse the JSON rule to validate it
      const parsedRule = JSON.parse(validationRule);

      const newValidation = await addFormValidation({
        name: validationName,
        rule: parsedRule,
        errorMessage: validationErrorMessage,
        affectedElementInstances: selectedElements,
      });

      if (newValidation) {
        toast.success("Validation rule added successfully");
        setNewValidationDialogOpen(false);
        resetValidationForm();
      } else {
        toast.error("Failed to add validation rule");
      }
    } catch (error) {
      console.log("error", error);
      toast.error("Invalid JSON");
    }
  };

  const handleEditValidation = async () => {
    if (!currentValidation) return;

    if (
      !validationName.trim() ||
      !validationRule.trim() ||
      !validationErrorMessage.trim() ||
      selectedElements.length === 0
    ) {
      toast.error("All fields are required to update a validation rule");
      return;
    }

    try {
      // Parse the JSON rule to validate it
      const parsedRule = JSON.parse(validationRule);

      const success = await updateFormValidation(
        parseInt(currentValidation.id.toString(), 10),
        {
          name: validationName,
          rule: parsedRule,
          errorMessage: validationErrorMessage,
          affectedElementInstances: selectedElements,
        }
      );

      if (success) {
        toast.success("Validation rule updated successfully");
        setEditValidationDialogOpen(false);
        setCurrentValidation(null);
        resetValidationForm();
      } else {
        toast.error("Failed to update validation rule");
      }
    } catch (error) {
      console.log("error", error);
      toast.error("Invalid JSON");
    }
  };

  const handleDeleteValidation = async (validationId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this validation rule? This action cannot be undone."
      )
    ) {
      const success = await deleteFormValidation(parseInt(validationId, 10));

      if (success) {
        toast.success("Validation rule deleted successfully");
      } else {
        toast.error("Failed to delete validation rule");
      }
    }
  };

  const openEditValidationDialog = (validation: FormValidation) => {
    setCurrentValidation(validation);
    setValidationName(validation.name || "");
    setValidationRule(JSON.stringify(validation.rule, null, 2));
    setValidationErrorMessage(validation.errorMessage || "");
    setSelectedElements(
      validation.affectedElementInstances
        ? validation.affectedElementInstances.map((id) => id.toString())
        : []
    );
    setEditValidationDialogOpen(true);
  };

  // Helper to find element label by id
  const getElementLabelById = (elementId: string) => {
    const element = allElements.find((el) => el.id.toString() === elementId);
    return element ? (element.labelOverride || (element.template?.label || "Unknown Element")) : "Unknown Element";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Form Validation Rules</h2>

        <Dialog
          open={newValidationDialogOpen}
          onOpenChange={setNewValidationDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Validation Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Validation Rule</DialogTitle>
              <DialogDescription>
                Create a form-level validation rule to validate across multiple
                fields
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="validation-name">Rule Name</Label>
                <Input
                  id="validation-name"
                  value={validationName}
                  onChange={(e) => setValidationName(e.target.value)}
                  placeholder="E.g., Total Percentage Check"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rule-template">Rule Template</Label>
                <div className="flex gap-2">
                  <Select value={ruleTemplate} onValueChange={setRuleTemplate}>
                    <SelectTrigger id="rule-template">
                      <SelectValue placeholder="Select a rule template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Rule</SelectItem>
                      <SelectItem value="sum_equals">
                        Sum Equals 100%
                      </SelectItem>
                      <SelectItem value="min_max_comparison">
                        Min/Max Comparison
                      </SelectItem>
                      <SelectItem value="all_required_if">
                        Required Fields If Condition
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={applyRuleTemplate}>
                    Apply Template
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="validation-rule">JSON Logic Rule</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>
                          Use JSON Logic format for validation rules. Reference
                          fields using their IDs as variables.
                        </p>
                        <p className="mt-1">
                          Example: {'{ ">": [{ "var": "age" }, 18] }'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  id="validation-rule"
                  value={validationRule}
                  onChange={(e) => setValidationRule(e.target.value)}
                  placeholder='{ "==": [{ "+": [{ "var": "field1" }, { "var": "field2" }] }, 100] }'
                  className="font-mono text-sm"
                  rows={8}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="validation-error">Error Message</Label>
                <Input
                  id="validation-error"
                  value={validationErrorMessage}
                  onChange={(e) => setValidationErrorMessage(e.target.value)}
                  placeholder="E.g., Total must equal 100%"
                />
              </div>

              <div className="grid gap-2">
                <Label>Affected Elements</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                  {allElements.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No elements available. Add elements to pages first.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {allElements.map((element) => (
                        <div
                          key={element.id.toString()}
                          className="flex items-start space-x-2"
                        >
                          <Checkbox
                            id={`element-${element.id.toString()}`}
                            checked={selectedElements.includes(
                              element.id.toString()
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedElements([
                                  ...selectedElements,
                                  element.id.toString(),
                                ]);
                              } else {
                                setSelectedElements(
                                  selectedElements.filter(
                                    (id) => id !== element.id.toString()
                                  )
                                );
                              }
                            }}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={`element-${element.id.toString()}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {element.labelOverride || (element.template?.label || "Unknown Element")}
                            </label>
                            <p className="text-sm text-muted-foreground">
                              {element.template?.type
                                ? element.template.type.replace("_", " ")
                                : "Unknown"}{" "}
                              on page{" "}
                              {(form.pages &&
                                form.pages.find(
                                  (p) =>
                                    p.elements &&
                                    p.elements.some(
                                      (e) =>
                                        e.id.toString() ===
                                        element.id.toString()
                                    )
                                )?.titleOverride) ||
                                "Unknown"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setNewValidationDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddValidation}>Add Validation Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={editValidationDialogOpen}
          onOpenChange={setEditValidationDialogOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Validation Rule</DialogTitle>
              <DialogDescription>
                Update form-level validation rule
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-validation-name">Rule Name</Label>
                <Input
                  id="edit-validation-name"
                  value={validationName}
                  onChange={(e) => setValidationName(e.target.value)}
                  placeholder="E.g., Total Percentage Check"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-rule-template">Rule Template</Label>
                <div className="flex gap-2">
                  <Select value={ruleTemplate} onValueChange={setRuleTemplate}>
                    <SelectTrigger id="edit-rule-template">
                      <SelectValue placeholder="Select a rule template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Rule</SelectItem>
                      <SelectItem value="sum_equals">
                        Sum Equals 100%
                      </SelectItem>
                      <SelectItem value="min_max_comparison">
                        Min/Max Comparison
                      </SelectItem>
                      <SelectItem value="all_required_if">
                        Required Fields If Condition
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={applyRuleTemplate}>
                    Apply Template
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-validation-rule">JSON Logic Rule</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>
                          Use JSON Logic format for validation rules. Reference
                          fields using their IDs as variables.
                        </p>
                        <p className="mt-1">
                          Example: {'{ ">": [{ "var": "age" }, 18] }'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  id="edit-validation-rule"
                  value={validationRule}
                  onChange={(e) => setValidationRule(e.target.value)}
                  placeholder='{ "==": [{ "+": [{ "var": "field1" }, { "var": "field2" }] }, 100] }'
                  className="font-mono text-sm"
                  rows={8}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-validation-error">Error Message</Label>
                <Input
                  id="edit-validation-error"
                  value={validationErrorMessage}
                  onChange={(e) => setValidationErrorMessage(e.target.value)}
                  placeholder="E.g., Total must equal 100%"
                />
              </div>

              <div className="grid gap-2">
                <Label>Affected Elements</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                  {allElements.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No elements available. Add elements to pages first.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {allElements.map((element) => (
                        <div
                          key={element.id.toString()}
                          className="flex items-start space-x-2"
                        >
                          <Checkbox
                            id={`edit-element-${element.id.toString()}`}
                            checked={selectedElements.includes(
                              element.id.toString()
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedElements([
                                  ...selectedElements,
                                  element.id.toString(),
                                ]);
                              } else {
                                setSelectedElements(
                                  selectedElements.filter(
                                    (id) => id !== element.id.toString()
                                  )
                                );
                              }
                            }}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={`edit-element-${element.id.toString()}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {element.labelOverride || (element.template?.label || "Unknown Element")}
                            </label>
                            <p className="text-sm text-muted-foreground">
                              {element.template?.type
                                ? element.template.type.replace("_", " ")
                                : "Unknown"}{" "}
                              on page{" "}
                              {(form.pages &&
                                form.pages.find(
                                  (p) =>
                                    p.elements &&
                                    p.elements.some(
                                      (e) =>
                                        e.id.toString() ===
                                        element.id.toString()
                                    )
                                )?.titleOverride) ||
                                "Unknown"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditValidationDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditValidation}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {form.validations && form.validations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-6">
              <Code className="h-10 w-10 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">
                No form validation rules yet. Add rules to validate across
                multiple fields.
              </p>
              <Button onClick={() => setNewValidationDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add First Validation Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {form.validations &&
            form.validations.map((validation) => (
              <Card key={validation.id.toString()}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{validation.name}</CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditValidationDialog(validation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteValidation(validation.id.toString())
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{validation.errorMessage}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Affected Elements:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {validation.affectedElementInstances &&
                          validation.affectedElementInstances.map((elementId) => (
                            <span
                              key={elementId.toString()}
                              className="text-xs px-2 py-1 bg-gray-100 rounded-full"
                            >
                              {getElementLabelById(elementId.toString())}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Validation Rule:
                      </h4>
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                        {JSON.stringify(validation.rule, null, 2)}
                      </pre>
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

export default ValidationRulesEditor;
