import React, { useState, useEffect, useMemo } from "react";
import { ElementInstance, ElementTemplate, Form, PageInstance } from "@repo/database/src/schema";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { validatePageBasic } from "@/lib/client-validation";

// Define missing types
interface FormWithValidations extends Form {
  pages: (PageInstance & {
    elements?: (ElementInstance & { template?: ElementTemplate })[];
  })[];
  validations?: any[];
  conditions?: any[];
}

type PageWithElements = PageInstance & {
  elements?: (ElementInstance & { template?: ElementTemplate })[];
};

interface ValidationResult {
  valid: boolean;
  errors: Array<{ elementId?: string; message: string }>;
}

// Helper function to get element properties
const getElementProperty = (element: ElementInstance & { template?: ElementTemplate }, key: string, defaultValue?: any) => {
  const properties = element.template?.properties || {};
  const propertiesOverride = element.propertiesOverride || {};
  return (propertiesOverride as any)[key] !== undefined
    ? (propertiesOverride as any)[key]
    : (properties as any)[key] !== undefined
      ? (properties as any)[key]
      : defaultValue;
};

// Remove all the duplicate type definitions
interface FormRendererProps {
  form: FormWithValidations;
  preview?: boolean;
  onSubmit?: (data: Record<string, any>) => void;
}

interface FormElementProps {
  element: ElementInstance & { template?: ElementTemplate };
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

const FormElement: React.FC<FormElementProps> = ({
  element,
  value,
  onChange,
  error,
}) => {
  const type = element.template?.type || '';
  const label = element.labelOverride || element.template?.label || '';

  switch (type) {
    case "text_input":
      return (
        <div className="grid gap-2">
          <Label
            htmlFor={element.id.toString()}
            className={
              element.required
                ? 'after:content-["*"] after:ml-0.5 after:text-red-500'
                : ""
            }
          >
            {label}
          </Label>
          <Input
            id={element.id.toString()}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getElementProperty(element, "placeholder", "")}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case "number_input":
      return (
        <div className="grid gap-2">
          <Label
            htmlFor={element.id.toString()}
            className={
              element.required
                ? 'after:content-["*"] after:ml-0.5 after:text-red-500'
                : ""
            }
          >
            {label}
          </Label>
          <Input
            id={element.id.toString()}
            type="number"
            value={value || ""}
            onChange={(e) => onChange(e.target.valueAsNumber || null)}
            placeholder={getElementProperty(element, "placeholder", "")}
            min={getElementProperty(element, "min")}
            max={getElementProperty(element, "max")}
            step={getElementProperty(element, "step", 1)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case "email":
      return (
        <div className="grid gap-2">
          <Label
            htmlFor={element.id.toString()}
            className={
              element.required
                ? 'after:content-["*"] after:ml-0.5 after:text-red-500'
                : ""
            }
          >
            {label}
          </Label>
          <Input
            id={element.id.toString()}
            type="email"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getElementProperty(element, "placeholder", "")}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case "textarea":
      return (
        <div className="grid gap-2">
          <Label
            htmlFor={element.id.toString()}
            className={
              element.required
                ? 'after:content-["*"] after:ml-0.5 after:text-red-500'
                : ""
            }
          >
            {label}
          </Label>
          <Textarea
            id={element.id.toString()}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getElementProperty(element, "placeholder", "")}
            rows={getElementProperty(element, "rows", 3)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case "checkbox":
      return (
        <div className="flex items-start space-x-2">
          <Checkbox
            id={element.id.toString()}
            checked={!!value}
            onCheckedChange={onChange}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor={element.id.toString()}
              className={
                element.required
                  ? 'after:content-["*"] after:ml-0.5 after:text-red-500'
                  : ""
              }
            >
              {label}
            </Label>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>
      );

    case "radio":
      const options = getElementProperty(element, "options", []) || [];
      return (
        <div className="grid gap-2">
          <Label
            className={
              element.required
                ? 'after:content-["*"] after:ml-0.5 after:text-red-500'
                : ""
            }
          >
            {label}
          </Label>
          <RadioGroup value={value || ""} onValueChange={onChange}>
            {options.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${element.id}-${index}`} />
                <Label htmlFor={`${element.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case "select":
      const selectOptions = getElementProperty(element, "options", []) || [];
      return (
        <div className="grid gap-2">
          <Label
            htmlFor={element.id.toString()}
            className={
              element.required
                ? 'after:content-["*"] after:ml-0.5 after:text-red-500'
                : ""
            }
          >
            {label}
          </Label>
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger id={element.id.toString()}>
              <SelectValue
                placeholder={getElementProperty(
                  element,
                  "placeholder",
                  "Select an option"
                )}
              />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case "date":
      return (
        <div className="grid gap-2">
          <Label
            htmlFor={element.id.toString()}
            className={
              element.required
                ? 'after:content-["*"] after:ml-0.5 after:text-red-500'
                : ""
            }
          >
            {label}
          </Label>
          <Input
            id={element.id.toString()}
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case "text":
      return (
        <div className="space-y-1">
          {label && (
            <h3 className="text-lg font-medium">{label}</h3>
          )}
          <div
            className="text-sm text-gray-700"
            dangerouslySetInnerHTML={{
              __html: getElementProperty(element, "content", "") || "",
            }}
          />
        </div>
      );

    case "image":
      return (
        <div className="space-y-2">
          {label && (
            <h3 className="text-lg font-medium">{label}</h3>
          )}
          <div className="overflow-hidden rounded-md">
            <img
              src={getElementProperty(
                element,
                "src",
                "/api/placeholder/400/300"
              )}
              alt={getElementProperty(
                element,
                "alt",
                label || "Form image"
              )}
              className="w-full object-cover"
            />
          </div>
          {getElementProperty(element, "caption") && (
            <p className="text-sm text-gray-500 text-center">
              {getElementProperty(element, "caption", "")}
            </p>
          )}
        </div>
      );

    default:
      return <div>Unsupported element type: {type}</div>;
  }
};

const FormRenderer: React.FC<FormRendererProps> = ({ form, onSubmit }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});

  // Cast form to any to avoid type errors with FormWithPages
  const typedForm = form as any;

  // Update the sortedPages calculation with proper types
  const sortedPages = useMemo(() => {
    if (!typedForm?.pages) return [];
    return [...typedForm.pages].sort((a: any, b: any) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      return orderA - orderB;
    });
  }, [typedForm?.pages]);

  // Initialize default values and visibility
  useEffect(() => {
    if (typedForm) {
      const defaults: Record<string, any> = {};

      // Set default values for elements
      typedForm.pages?.forEach((page: any) => {
        page.elements?.forEach((element: any) => {
          if (element.default_value !== undefined) {
            defaults[element.id.toString()] = element.default_value;
          }
        });
      });

      // Set initial form data
      setFormData(defaults);
      updateVisibility(defaults);
    }
  }, [typedForm]);

  // Update visibility when form data changes
  useEffect(() => {
    updateVisibility(formData);
  }, [formData]);

  const updateVisibility = async (data: Record<string, any>) => {
    try {
      // Client-side implementation of visibility logic
      const newVisibility: Record<string, boolean> = {};

      // Set default visibility (all visible)
      if (typedForm?.pages) {
        typedForm.pages.forEach((page: any) => {
          if (page.id) {
            newVisibility[`page_${page.id.toString()}`] = true;
          }

          if (page.elements) {
            page.elements.forEach((element: any) => {
              if (element.id) {
                newVisibility[`element_${element.id.toString()}`] = true;
              }
            });
          }
        });
      }

      // Process conditions if they exist
      if (typedForm?.conditions && typedForm.conditions.length > 0) {
        for (const condition of typedForm.conditions) {
          try {
            if (!condition.source_element_id) continue;

            const sourceValue = data[condition.source_element_id.toString()];
            let conditionMet = false;

            // Evaluate the condition
            switch (condition.operator) {
              case "equals":
                conditionMet = sourceValue === condition.value;
                break;
              case "not_equals":
                conditionMet = sourceValue !== condition.value;
                break;
              case "contains":
                conditionMet = String(sourceValue).includes(
                  String(condition.value)
                );
                break;
              case "greater_than":
                conditionMet = Number(sourceValue) > Number(condition.value);
                break;
              case "less_than":
                conditionMet = Number(sourceValue) < Number(condition.value);
                break;
            }

            // Apply the condition result
            if (condition.target_id && condition.target_type) {
              const targetKey = `${
                condition.target_type
              }_${condition.target_id.toString()}`;
              newVisibility[targetKey] =
                condition.action === "show" ? conditionMet : !conditionMet;
            }
          } catch (error) {
            console.error("Condition evaluation error:", error);
          }
        }
      }

      setVisibility(newVisibility);
    } catch (error) {
      console.error("Error evaluating conditions:", error);
      // Set default visibility (all visible)
      setVisibility({});
    }
  };

  const handleElementChange = (elementId: string, value: any) => {
    const newFormData = { ...formData, [elementId]: value };
    setFormData(newFormData);

    // Clear validation error for this element
    if (validationErrors[elementId]) {
      const newErrors = { ...validationErrors };
      delete newErrors[elementId];
      setValidationErrors(newErrors);
    }
  };

  const validateCurrentPage = async () => {
    if (!typedForm || !sortedPages || currentPageIndex === null) {
      return true;
    }

    try {
      // Use client-side validation
      const currentPage = sortedPages[currentPageIndex];
      const result = validatePageBasic(currentPage, formData);

      // Update validation errors
      const newErrors: Record<string, string> = {};
      result.errors.forEach((error: any) => {
        if (error.elementId) {
          newErrors[error.elementId] = error.message;
        }
      });

      setValidationErrors(newErrors);
      return result.valid;
    } catch (error: any) {
      console.error("Error validating page:", error);
      return false;
    }
  };

  const handleNextPage = async () => {
    if (currentPageIndex === null) {
      setCurrentPageIndex(0);
      return;
    }

    // Validate current page before proceeding
    const isValid = await validateCurrentPage();
    if (!isValid) {
      // Don't proceed if validation fails
      return;
    }

    if (currentPageIndex < sortedPages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else {
      // Last page, submit the form
      handleSubmit();
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex === null) {
      setCurrentPageIndex(0);
      return;
    }

    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const validateForm = async (): Promise<ValidationResult> => {
    const result: ValidationResult = { valid: true, errors: [] };

    // Validate each page
    for (const page of sortedPages) {
      const pageResult = validatePageBasic(page, formData);
      if (!pageResult.valid) {
        result.valid = false;
        result.errors.push(...pageResult.errors);
      }
    }

    return result;
  };

  const handleSubmit = async () => {
    try {
      // Validate the entire form
      const validationResult = await validateForm();
      if (!validationResult.valid) {
        return;
      }

      // Submit the form data if onSubmit is provided
      if (onSubmit) {
        onSubmit(formData);
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
    }
  };

  const isElementVisible = (element: ElementInstance & { template?: ElementTemplate }) => {
    const elementKey = `element_${element.id.toString()}`;
    return visibility[elementKey] !== false; // Default to visible if not specified
  };

  const isPageVisible = (page: PageWithElements) => {
    const pageKey = `page_${page.id.toString()}`;
    return visibility[pageKey] !== false; // Default to visible if not specified
  };

  // Calculate visible pages
  const visiblePages = useMemo(() => {
    return sortedPages.filter((page: any) => isPageVisible(page));
  }, [sortedPages, visibility]);

  // Get the current page
  const currentPage = useMemo(() => {
    return currentPageIndex !== null && visiblePages.length > 0
      ? visiblePages[currentPageIndex]
      : null;
  }, [currentPageIndex, visiblePages]);

  // Calculate visible elements on the current page
  const visibleElements = useMemo(() => {
    if (!currentPage) return [];
    return (currentPage.elements || [])
      .filter((element: any) => isElementVisible(element))
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  }, [currentPage, visibility]);

  // Adjust current page index if needed after filtering
  useEffect(() => {
    if (visiblePages.length > 0 && currentPageIndex >= visiblePages.length) {
      setCurrentPageIndex(Math.max(0, visiblePages.length - 1));
    }
  }, [visiblePages.length, currentPageIndex]);

  // If no pages are visible or no form is provided
  if (!typedForm || visiblePages.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center p-6">
            <p className="text-gray-500">
              No form content available to display.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Update the handleFormSubmit function
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <form onSubmit={handleFormSubmit} className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{typedForm.title}</CardTitle>
          {typedForm.description && (
            <CardDescription>{typedForm.description}</CardDescription>
          )}
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {visiblePages.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">
                    {visiblePages[currentPageIndex].title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Page {currentPageIndex + 1} of {visiblePages.length}
                  </p>
                </div>

                {visiblePages[currentPageIndex].description && (
                  <p className="text-sm text-gray-500 mb-4">
                    {visiblePages[currentPageIndex].description}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-6">
              {visibleElements.map((element: any) => (
                <FormElement
                  key={element.id.toString()}
                  element={element}
                  value={formData[element.id.toString()]}
                  onChange={(value) =>
                    handleElementChange(element.id.toString(), value)
                  }
                  error={validationErrors[element.id.toString()]}
                />
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevPage}
            disabled={currentPageIndex === 0}
          >
            Previous
          </Button>

          {currentPageIndex < visiblePages.length - 1 ? (
            <Button type="button" onClick={handleNextPage}>
              Next
            </Button>
          ) : (
            <Button type="submit">{onSubmit ? "Cancel" : "Submit"}</Button>
          )}
        </CardFooter>
      </Card>
    </form>
  );
};

export default FormRenderer;
