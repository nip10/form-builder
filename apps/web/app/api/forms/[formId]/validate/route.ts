import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { FormRepository } from "@/lib/repositories/form-repository";
import {
  ElementInstanceTable,
  ElementTemplateTable,
  PageInstanceTable,
  ConditionTable,
} from "@repo/database/src/schema";
import { eq, inArray } from "drizzle-orm";
import { validateElement } from "@/lib/validation";
import { z } from "zod";
import jsonLogic from "json-logic-js";

interface RouteParams {
  params: {
    formId: string;
  };
}

const formRepository = new FormRepository();

// Zod schema for form ID validation
const formIdSchema = z.coerce.number().int().positive();

// Zod schema for element ID validation
const elementIdSchema = z.coerce.number().int().positive();

// Zod schema for page ID validation
const pageIdSchema = z.coerce.number().int().positive();

// Zod schema for element validation request
const elementValidationSchema = z.object({
  elementId: elementIdSchema,
  value: z.any(),
});

// Zod schema for page validation request
const pageValidationSchema = z.object({
  pageId: pageIdSchema,
  formData: z.record(z.any()),
});

// Zod schema for condition evaluation request
const conditionEvaluationSchema = z.object({
  formData: z.record(z.any()),
});

// POST /api/forms/[formId]/validate - Validate a single element
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate and parse the form ID
    const formIdResult = formIdSchema.safeParse(params.formId);

    if (!formIdResult.success) {
      return NextResponse.json({ error: "Invalid form ID format" }, { status: 400 });
    }

    const formId = formIdResult.data;

    // Parse and validate the request body
    const requestData = await request.json();
    const validationResult = elementValidationSchema.safeParse(requestData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid validation request",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { elementId, value } = validationResult.data;

    // Find the element instance
    const elementInstance = await db.query.ElementInstanceTable.findFirst({
      where: eq(ElementInstanceTable.id, elementId),
    });

    if (!elementInstance) {
      return NextResponse.json({ error: "Element instance not found" }, { status: 404 });
    }

    // Find the element template
    const elementTemplate = await db.query.ElementTemplateTable.findFirst({
      where: eq(ElementTemplateTable.id, elementInstance.templateId),
    });

    if (!elementTemplate) {
      return NextResponse.json({ error: "Element template not found" }, { status: 404 });
    }

    // Combine template and instance for validation
    const combinedElement = {
      ...elementTemplate,
      id: elementInstance.id, // Use instance ID for validation results
      required: elementInstance.required,
      validations: elementInstance.validations || [],
      // Override template properties with instance-specific ones if they exist
      label: elementInstance.labelOverride || elementTemplate.label,
      properties: {
        ...(elementTemplate.properties || {}),
        ...(elementInstance.propertiesOverride || {}),
      },
    };

    // Validate the element
    const result = validateElement(combinedElement, value);

    // Convert ID to string in errors
    const sanitizedResult = {
      valid: result.valid,
      errors: result.errors.map((error) => ({
        elementId: error.elementId ? error.elementId.toString() : undefined,
        message: error.message,
        rule: error.rule,
      })),
    };

    return NextResponse.json({ result: sanitizedResult });
  } catch (error: any) {
    console.error("Error validating element:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate element" },
      { status: 500 },
    );
  }
}

// PUT /api/forms/[formId]/validate - Validate a page
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate and parse the form ID
    const formIdResult = formIdSchema.safeParse(params.formId);

    if (!formIdResult.success) {
      return NextResponse.json({ error: "Invalid form ID format" }, { status: 400 });
    }

    const formId = formIdResult.data;

    // Parse and validate the request body
    const requestData = await request.json();
    const validationResult = pageValidationSchema.safeParse(requestData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid page validation request",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { pageId, formData } = validationResult.data;

    // Find the page
    const page = await db.query.PageInstanceTable.findFirst({
      where: eq(PageInstanceTable.id, pageId),
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Find all element instances for this page
    const elementInstances = await db.query.ElementInstanceTable.findMany({
      where: eq(ElementInstanceTable.pageInstanceId, pageId),
    });

    // Get all template IDs
    const templateIds = elementInstances.map((instance) => instance.templateId);

    // Find all element templates
    const elementTemplates = await db.query.ElementTemplateTable.findMany({
      where: templateIds.length > 0 ? inArray(ElementTemplateTable.id, templateIds) : undefined,
    });

    // Create a map of templates by ID for easy lookup
    const templatesMap = new Map(elementTemplates.map((template) => [template.id, template]));

    // Validate each element
    const result = {
      valid: true,
      errors: [] as Array<{
        elementId?: string;
        message: string;
        rule?: any;
      }>,
    };

    for (const instance of elementInstances) {
      const instanceId = instance.id.toString();
      const value = formData[instanceId];

      // Find the corresponding template
      const template = templatesMap.get(instance.templateId);

      if (!template) {
        console.error(`Template not found for instance ${instanceId}`);
        continue;
      }

      // Combine template and instance for validation
      const combinedElement = {
        ...template,
        id: instance.id, // Use instance ID for validation results
        required: instance.required,
        validations: instance.validations || [],
        // Override template properties with instance-specific ones if they exist
        label: instance.labelOverride || template.label,
        properties: {
          ...(template.properties || {}),
          ...(instance.propertiesOverride || {}),
        },
      };

      const elementValidation = validateElement(combinedElement, value);

      if (!elementValidation.valid) {
        result.valid = false;
        // Convert ID to string in errors
        result.errors.push(
          ...elementValidation.errors.map((error) => ({
            elementId: error.elementId ? error.elementId.toString() : undefined,
            message: error.message,
            rule: error.rule,
          })),
        );
      }
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Error validating page:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate page" },
      { status: 500 },
    );
  }
}

// PATCH /api/forms/[formId]/validate - Evaluate conditions
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate and parse the form ID
    const formIdResult = formIdSchema.safeParse(params.formId);

    if (!formIdResult.success) {
      return NextResponse.json({ error: "Invalid form ID format" }, { status: 400 });
    }

    const formId = formIdResult.data;

    // Parse and validate the request body
    const requestData = await request.json();
    const validationResult = conditionEvaluationSchema.safeParse(requestData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid condition evaluation request",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { formData } = validationResult.data;

    // Find the form
    const form = await formRepository.getFormById(formId);
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Get all conditions for this form
    const conditions = await db.query.ConditionTable.findMany({
      where: eq(ConditionTable.formId, formId),
    });

    // Get all groups for this form
    const formWithRelations = await formRepository.getFormWithRelations(formId);
    if (!formWithRelations) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const groups = formWithRelations.groups;
    const pages = formWithRelations.pages;

    // Initialize visibility (all visible by default)
    const visibility: Record<string, boolean> = {};

    // Set default visibility for groups
    for (const group of groups) {
      visibility[`group_${group.id}`] = true;
    }

    // Set default visibility for pages
    for (const page of pages) {
      visibility[`page_${page.id}`] = true;

      // Set default visibility for elements
      for (const element of page.elements || []) {
        visibility[`element_${element.id}`] = true;
      }
    }

    // Implement condition evaluation logic for SQL database
    if (conditions.length > 0) {
      // Process each condition
      for (const condition of conditions) {
        try {
          // Apply JSON Logic rule to form data
          const isRuleMet = jsonLogic.apply(condition.rule as any, formData);

          // Determine target visibility based on condition action and rule result
          const shouldBeVisible = condition.action === "show" ? isRuleMet : !isRuleMet;

          // Update visibility based on target type
          const targetKey = `${condition.targetType.toLowerCase()}_${condition.targetId}`;
          visibility[targetKey] = shouldBeVisible;

          // If hiding a group, also hide its pages and elements
          if (condition.targetType === "group" && !shouldBeVisible) {
            const groupId = condition.targetId;

            // Find pages in this group
            const groupPages = pages.filter((page) => {
              const pageGroup = groups.find((g) => g.pages?.some((p) => p.id === page.id));
              return pageGroup?.id === groupId;
            });

            // Hide all pages in this group
            for (const page of groupPages) {
              visibility[`page_${page.id}`] = false;

              // Hide all elements in this page
              for (const element of page.elements || []) {
                visibility[`element_${element.id}`] = false;
              }
            }
          }

          // If hiding a page, also hide its elements
          if (condition.targetType === "page" && !shouldBeVisible) {
            const pageId = condition.targetId;
            const page = pages.find((p) => p.id === pageId);

            if (page) {
              // Hide all elements in this page
              for (const element of page.elements || []) {
                visibility[`element_${element.id}`] = false;
              }
            }
          }
        } catch (error) {
          console.error(`Error evaluating condition ${condition.id}:`, error);
          // On error, keep default visibility
        }
      }
    }

    return NextResponse.json({ visibility });
  } catch (error: any) {
    console.error("Error evaluating conditions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to evaluate conditions" },
      { status: 500 },
    );
  }
}
