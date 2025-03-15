import { ValidationResult } from "@/types/form";

/**
 * Client-side validation functions that call the API endpoints
 */

/**
 * Validates a single element instance
 */
export const validateElementClient = async (
  formId: string,
  elementInstanceId: string,
  value: any
): Promise<ValidationResult> => {
  try {
    const response = await fetch(`/api/forms/${formId}/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ elementId: elementInstanceId, value }),
    });

    if (!response.ok) {
      throw new Error("Failed to validate element");
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Error validating element:", error);
    return {
      valid: false,
      errors: [
        {
          elementId: elementInstanceId,
          message: "An error occurred while validating this field",
        },
      ],
    };
  }
};

/**
 * Validates a page with all its element instances
 */
export const validatePageClient = async (
  formId: string,
  pageId: string,
  formData: Record<string, any>
): Promise<ValidationResult> => {
  try {
    const response = await fetch(`/api/forms/${formId}/validate`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pageId, formData }),
    });

    if (!response.ok) {
      throw new Error("Failed to validate page");
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Error validating page:", error);
    return {
      valid: false,
      errors: [
        {
          message: "An error occurred while validating this page",
        },
      ],
    };
  }
};

/**
 * Evaluates conditions for a form
 */
export const evaluateConditionsClient = async (
  formId: string,
  formData: Record<string, any>
): Promise<Record<string, boolean>> => {
  try {
    const response = await fetch(`/api/forms/${formId}/validate`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ formData }),
    });

    if (!response.ok) {
      throw new Error("Failed to evaluate conditions");
    }

    const data = await response.json();
    return data.visibility;
  } catch (error) {
    console.error("Error evaluating conditions:", error);
    // Return empty object (all visible by default)
    return {};
  }
};

/**
 * Client-side implementation of basic element validation
 * This can be used for immediate feedback without API calls
 *
 * Note: This function expects a combined element (template + instance)
 */
export const validateElementBasic = (
  element: any,
  value: any
): ValidationResult => {
  const result: ValidationResult = { valid: true, errors: [] };

  // Check required field
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

  // Basic type validations
  if (element.type === "email" && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(value))) {
      result.valid = false;
      result.errors.push({
        elementId: element._id?.toString(),
        message: "Please enter a valid email address",
      });
    }
  }

  if (element.type === "number_input" && value !== "") {
    const numValue = Number(value);

    // Check if it's a valid number
    if (isNaN(numValue)) {
      result.valid = false;
      result.errors.push({
        elementId: element._id?.toString(),
        message: "Please enter a valid number",
      });
    }

    // Check min/max if they exist
    if (
      element.properties?.min !== undefined &&
      numValue < element.properties.min
    ) {
      result.valid = false;
      result.errors.push({
        elementId: element._id?.toString(),
        message: `Value must be at least ${element.properties.min}`,
      });
    }

    if (
      element.properties?.max !== undefined &&
      numValue > element.properties.max
    ) {
      result.valid = false;
      result.errors.push({
        elementId: element._id?.toString(),
        message: `Value must be at most ${element.properties.max}`,
      });
    }
  }

  // Process each validation rule from the element instance
  if (element.validations && element.validations.length > 0) {
    for (const validation of element.validations) {
      try {
        if (validation.type === "regex" && validation.rule) {
          const regex = new RegExp(validation.rule);
          if (!regex.test(String(value))) {
            result.valid = false;
            result.errors.push({
              elementId: element._id?.toString(),
              message: validation.error_message || "Invalid format",
              rule: validation.rule,
            });
          }
        }
        // Add other validation types as needed
      } catch (error) {
        console.error("Validation error:", error);
      }
    }
  }

  return result;
};

/**
 * Helper function to check if an element is an input element
 */
export const isInputElement = (type: string): boolean => {
  const inputTypes = [
    "text_input",
    "number_input",
    "email",
    "textarea",
    "checkbox",
    "radio",
    "select",
    "date",
  ];
  return inputTypes.includes(type);
};

/**
 * Client-side implementation of page validation
 * This can be used for immediate feedback without API calls
 *
 * Note: This function expects a page with combined elements (template + instance)
 */
export const validatePageBasic = (
  page: any,
  formData: Record<string, any>
): ValidationResult => {
  const result: ValidationResult = { valid: true, errors: [] };

  // Validate each input element on the page
  for (const element of page.elements || []) {
    if (isInputElement(element.type)) {
      const value = formData[element._id.toString()];
      const elementValidation = validateElementBasic(element, value);

      if (!elementValidation.valid) {
        result.valid = false;
        result.errors.push(...elementValidation.errors);
      }
    }
  }

  return result;
};
