import jsonLogic from "json-logic-js";
import {
  ElementModel,
  PageModel,
  ConditionModel,
  FormValidationModel,
  GroupModel,
} from "@/lib/models";
import { ElementDocument, FormDocument } from "@/lib/schemas";
import { ObjectId } from "bson";

// Interface for validation results
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    elementId?: string | ObjectId;
    message: string;
    rule?: any;
  }>;
}

// Helper to find an element by ID
const findElementById = async (
  elementId: ObjectId | string
): Promise<ElementDocument | null> => {
  const objectId =
    typeof elementId === "string" ? new ObjectId(elementId) : elementId;

  try {
    return await ElementModel.findById(objectId);
  } catch (error) {
    console.error("Error finding element:", error);
    return null;
  }
};

// Helper to get all elements for a form
const getFormElements = async (
  form: FormDocument
): Promise<ElementDocument[]> => {
  if (!form.pages || form.pages.length === 0) return [];

  try {
    // First get all pages
    const pages = await PageModel.find({
      _id: { $in: form.pages },
    });

    // Extract all element IDs from pages
    const elementIds = pages.flatMap((page) => page.element_instances || []);
    if (elementIds.length === 0) return [];

    // Get all elements
    return await ElementModel.find({
      _id: { $in: elementIds },
    });
  } catch (error) {
    console.error("Error getting form elements:", error);
    return [];
  }
};

// Evaluate element-level validations
export const validateElement = (
  element: ElementDocument,
  value: any
): ValidationResult => {
  const result: ValidationResult = { valid: true, errors: [] };

  // Check required field first (special case)
  if (
    element.required &&
    (value === undefined || value === null || value === "")
  ) {
    result.valid = false;
    result.errors.push({
      elementId: element._id?.toString(),
      message: "This field is required",
    });
    return result;
  }

  // Skip other validations if value is empty and not required
  if (value === undefined || value === null || value === "") {
    return result;
  }

  // Process each validation rule
  for (const validation of element.validations || []) {
    try {
      // Handle different validation types
      if (validation.type === "jsonLogic") {
        // For JSON Logic rules
        const data = { [element._id?.toString() || "unknown"]: value };
        const isValid = jsonLogic.apply(validation.rule, data);

        if (!isValid) {
          result.valid = false;
          result.errors.push({
            elementId: element._id?.toString(),
            message: validation.error_message || "Validation error",
            rule: validation.rule,
          });
        }
      } else if (validation.type === "regex") {
        // For regex validations
        const regex = new RegExp(validation.rule);
        if (!regex.test(String(value))) {
          result.valid = false;
          result.errors.push({
            elementId: element._id?.toString(),
            message: validation.error_message || "Validation error",
            rule: validation.rule,
          });
        }
      }
      // Add other validation types as needed
    } catch (error) {
      console.error("Validation error:", error);
      result.valid = false;
      result.errors.push({
        elementId: element._id?.toString(),
        message: "Validation error occurred",
        rule: validation.rule,
      });
    }
  }

  return result;
};

// Validate entire form submission
export const validateFormSubmission = async (
  form: FormDocument,
  submissionData: Record<string, any>
): Promise<ValidationResult> => {
  const result: ValidationResult = { valid: true, errors: [] };

  // 1. Get all elements for this form
  const elements = await getFormElements(form);

  // 2. Validate individual elements
  for (const element of elements) {
    const elementId = element._id?.toString() || "";
    const value = submissionData[elementId];
    const elementValidation = validateElement(element, value);

    if (!elementValidation.valid) {
      result.valid = false;
      result.errors.push(...elementValidation.errors);
    }
  }

  // 3. Get and validate form-level validations
  if (form.form_validations && form.form_validations.length > 0) {
    try {
      const formValidations = await FormValidationModel.find({
        _id: { $in: form.form_validations },
      });

      for (const validation of formValidations) {
        try {
          // Prepare data object with only relevant fields
          const data: Record<string, any> = {};
          if (validation.affected_elements) {
            for (const elementId of validation.affected_elements) {
              const idStr = elementId.toString();
              data[idStr] = submissionData[idStr];
            }
          }

          // Apply the JSON Logic rule
          const isValid = jsonLogic.apply(validation.rule, data);

          if (!isValid) {
            result.valid = false;
            result.errors.push({
              message: validation.error_message || "Validation error",
              rule: validation.rule,
            });
          }
        } catch (error) {
          console.error("Form validation error:", error);
          result.valid = false;
          result.errors.push({
            message: "Form validation error occurred",
            rule: validation.rule,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching form validations:", error);
    }
  }

  return result;
};

// Helper to process conditional logic
export const evaluateConditions = async (
  form: FormDocument,
  submissionData: Record<string, any>
): Promise<Record<string, boolean>> => {
  const visibility: Record<string, boolean> = {};

  // Set default visibility for all pages, groups, and elements
  // 1. Set visibility for groups
  if (form.groups && form.groups.length > 0) {
    try {
      const groups = await GroupModel.find({
        _id: { $in: form.groups },
      });

      for (const group of groups) {
        if (group._id) {
          visibility[`group_${group._id.toString()}`] = true;
        }
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  }

  // 2. Set visibility for pages and their elements
  if (form.pages && form.pages.length > 0) {
    try {
      const pages = await PageModel.find({
        _id: { $in: form.pages },
      });

      for (const page of pages) {
        if (page._id) {
          visibility[`page_${page._id.toString()}`] = true;
        }

        // Get elements for this page
        if (page.element_instances && page.element_instances.length > 0) {
          const elements = await ElementModel.find({
            _id: { $in: page.element_instances },
          });

          for (const element of elements) {
            if (element._id) {
              visibility[`element_${element._id.toString()}`] = true;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching pages or elements:", error);
    }
  }

  // 3. Process each condition
  if (form.conditions && form.conditions.length > 0) {
    try {
      const conditions = await ConditionModel.find({
        _id: { $in: form.conditions },
      });

      for (const condition of conditions) {
        try {
          if (!condition.source_element_id) continue;

          const sourceElement = await findElementById(
            condition.source_element_id
          );
          if (!sourceElement) continue;

          const sourceValue =
            submissionData[condition.source_element_id.toString()];
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
            visibility[targetKey] =
              condition.action === "show" ? conditionMet : !conditionMet;
          }
        } catch (error) {
          console.error("Condition evaluation error:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching conditions:", error);
    }
  }

  return visibility;
};
