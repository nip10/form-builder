import jsonLogic from "json-logic-js";
import { db } from "@repo/database";
import {
  ElementTemplateTable,
  PageInstanceTable,
  ElementInstanceTable,
  FormValidationTable,
  ConditionTable,
  GroupInstanceTable,
  FormTable,
  Form,
} from "@repo/database/src/schema";
import { eq, inArray } from "drizzle-orm";

// Interface for validation results
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    elementId?: string | number;
    message: string;
    rule?: any;
  }>;
}

// Helper to find an element by ID
const findElementById = async (elementId: number): Promise<any | null> => {
  try {
    const elementInstance = await db.query.ElementInstanceTable.findFirst({
      where: eq(ElementInstanceTable.id, elementId),
    });

    if (!elementInstance) return null;

    const elementTemplate = await db.query.ElementTemplateTable.findFirst({
      where: eq(ElementTemplateTable.id, elementInstance.templateId),
    });

    if (!elementTemplate) return null;

    // Combine template and instance
    return {
      ...elementTemplate,
      id: elementInstance.id,
      required: elementInstance.required,
      validations: elementInstance.validations || [],
      label: elementInstance.labelOverride || elementTemplate.label,
      properties: {
        ...(elementTemplate.properties || {}),
        ...(elementInstance.propertiesOverride || {}),
      },
    };
  } catch (error) {
    console.error("Error finding element:", error);
    return null;
  }
};

// Helper to get all elements for a form
const getFormElements = async (form: Form): Promise<any[]> => {
  try {
    // Get all pages for this form's groups
    const groups = await db.query.GroupInstanceTable.findMany({
      where: eq(GroupInstanceTable.formId, form.id),
    });

    if (groups.length === 0) return [];

    const groupIds = groups.map((g) => g.id);

    const pages = await db.query.PageInstanceTable.findMany({
      where: groupIds.length > 0 ? inArray(PageInstanceTable.groupInstanceId, groupIds) : undefined,
    });

    if (pages.length === 0) return [];

    const pageIds = pages.map((p) => p.id);

    // Get all elements for these pages
    const elementInstances = await db.query.ElementInstanceTable.findMany({
      where: pageIds.length > 0 ? inArray(ElementInstanceTable.pageInstanceId, pageIds) : undefined,
    });

    if (elementInstances.length === 0) return [];

    // Get all templates
    const templateIds = elementInstances.map((e) => e.templateId);

    const elementTemplates = await db.query.ElementTemplateTable.findMany({
      where: templateIds.length > 0 ? inArray(ElementTemplateTable.id, templateIds) : undefined,
    });

    // Create a map of templates by ID for easy lookup
    const templatesMap = new Map(elementTemplates.map((template) => [template.id, template]));

    // Combine templates and instances
    return elementInstances
      .map((instance) => {
        const template = templatesMap.get(instance.templateId);
        if (!template) return null;

        return {
          ...template,
          id: instance.id,
          required: instance.required,
          validations: instance.validations || [],
          label: instance.labelOverride || template.label,
          properties: {
            ...(template.properties || {}),
            ...(instance.propertiesOverride || {}),
          },
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error("Error getting form elements:", error);
    return [];
  }
};

// Evaluate element-level validations
export const validateElement = (element: any, value: any): ValidationResult => {
  const result: ValidationResult = { valid: true, errors: [] };

  // Check required field first (special case)
  if (element.required && (value === undefined || value === null || value === "")) {
    result.valid = false;
    result.errors.push({
      elementId: element.id,
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
        const data = { [element.id.toString()]: value };
        const isValid = jsonLogic.apply(validation.rule as any, data);

        if (!isValid) {
          result.valid = false;
          result.errors.push({
            elementId: element.id,
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
            elementId: element.id,
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
        elementId: element.id,
        message: "Validation error occurred",
        rule: validation.rule,
      });
    }
  }

  return result;
};

// Validate entire form submission
export const validateFormSubmission = async (
  form: Form,
  submissionData: Record<string, any>,
): Promise<ValidationResult> => {
  const result: ValidationResult = { valid: true, errors: [] };

  // 1. Get all elements for this form
  const elements = await getFormElements(form);

  // 2. Validate individual elements
  for (const element of elements) {
    const elementId = element.id.toString();
    const value = submissionData[elementId];
    const elementValidation = validateElement(element, value);

    if (!elementValidation.valid) {
      result.valid = false;
      result.errors.push(...elementValidation.errors);
    }
  }

  // 3. Get and validate form-level validations
  const formValidations = await db.query.FormValidationTable.findMany({
    where: eq(FormValidationTable.formId, form.id),
  });

  // TODO: Implement form-level validation for SQL database
  // For now, we'll just return the element-level validation results

  return result;
};

// Helper to process conditional logic
export const evaluateConditions = async (form: Form): Promise<Record<string, boolean>> => {
  const visibility: Record<string, boolean> = {};

  // Get groups for this form
  const groups = await db.query.GroupInstanceTable.findMany({
    where: eq(GroupInstanceTable.formId, form.id),
  });

  if (groups.length === 0) return visibility;

  // Get pages for these groups
  const groupIds = groups.map((g) => g.id);
  const pages = await db.query.PageInstanceTable.findMany({
    where: groupIds.length > 0 ? inArray(PageInstanceTable.groupInstanceId, groupIds) : undefined,
  });

  // Get elements for these pages
  const pageIds = pages.map((p) => p.id);
  const elements = await db.query.ElementInstanceTable.findMany({
    where: pageIds.length > 0 ? inArray(ElementInstanceTable.pageInstanceId, pageIds) : undefined,
  });

  // Create maps for quick lookups
  const pagesByGroupId = new Map();
  pages.forEach((page) => {
    const groupId = page.groupInstanceId;
    if (!pagesByGroupId.has(groupId)) {
      pagesByGroupId.set(groupId, []);
    }
    pagesByGroupId.get(groupId).push(page);
  });

  const elementsByPageId = new Map();
  elements.forEach((element) => {
    const pageId = element.pageInstanceId;
    if (!elementsByPageId.has(pageId)) {
      elementsByPageId.set(pageId, []);
    }
    elementsByPageId.get(pageId).push(element);
  });

  // Set default visibility for all groups, pages, and elements
  for (const group of groups) {
    visibility[`group_${group.id}`] = true;

    const groupPages = pagesByGroupId.get(group.id) || [];
    for (const page of groupPages) {
      visibility[`page_${page.id}`] = true;

      const pageElements = elementsByPageId.get(page.id) || [];
      for (const element of pageElements) {
        visibility[`element_${element.id}`] = true;
      }
    }
  }

  // Get all conditions for this form
  const conditions = await db.query.ConditionTable.findMany({
    where: eq(ConditionTable.formId, form.id),
  });

  // TODO: Implement condition evaluation logic for SQL database
  // For now, we'll just return the default visibility

  return visibility;
};
