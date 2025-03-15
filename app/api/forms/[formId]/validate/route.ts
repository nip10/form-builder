import { NextRequest, NextResponse } from "next/server";
import { initializePapr } from "@/lib/db";
import {
  ElementModel,
  PageModel,
  ConditionModel,
  GroupModel,
  FormModel,
} from "@/lib/models";
import { ObjectId } from "bson";
import { validateElement } from "@/lib/validation";

// POST /api/forms/[formId]/validate - Validate a single element
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    await initializePapr();

    const { formId } = await params;
    const { elementId, value } = await request.json();

    if (!ObjectId.isValid(formId) || !ObjectId.isValid(elementId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Find the element
    const element = await ElementModel.findOne({
      _id: new ObjectId(elementId),
    });
    if (!element) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }

    // Validate the element
    const result = validateElement(element, value);

    // Convert ObjectId to string in errors
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
      { status: 500 }
    );
  }
}

// PUT /api/forms/[formId]/validate - Validate a page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    await initializePapr();

    const { formId } = await params;
    const { pageId, formData } = await request.json();

    if (!ObjectId.isValid(formId) || !ObjectId.isValid(pageId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Find the page
    const page = await PageModel.findOne({ _id: new ObjectId(pageId) });
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Find all elements for this page
    const elements = await ElementModel.find({
      _id: { $in: page.elements || [] },
    });

    // Validate each element
    const result = {
      valid: true,
      errors: [] as Array<{
        elementId?: string;
        message: string;
        rule?: any;
      }>,
    };

    for (const element of elements) {
      const elementId = element._id.toString();
      const value = formData[elementId];
      const elementValidation = validateElement(element, value);

      if (!elementValidation.valid) {
        result.valid = false;
        // Convert ObjectId to string in errors
        result.errors.push(
          ...elementValidation.errors.map((error) => ({
            elementId: error.elementId ? error.elementId.toString() : undefined,
            message: error.message,
            rule: error.rule,
          }))
        );
      }
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Error validating page:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate page" },
      { status: 500 }
    );
  }
}

// PATCH /api/forms/[formId]/validate - Evaluate conditions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    await initializePapr();

    const { formId } = await params;
    const { formData } = await request.json();

    if (!ObjectId.isValid(formId)) {
      return NextResponse.json(
        { error: "Invalid form ID format" },
        { status: 400 }
      );
    }

    // Find the form
    const form = await FormModel.findOne({ _id: new ObjectId(formId) });
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Get all conditions for this form
    const conditions = await ConditionModel.find({
      _id: { $in: form.conditions || [] },
    });

    // Get all pages and their elements
    const pages = await PageModel.find({
      _id: { $in: form.pages || [] },
    });

    // Get all groups
    const groups = await GroupModel.find({
      _id: { $in: form.groups || [] },
    });

    // Initialize visibility (all visible by default)
    const visibility: Record<string, boolean> = {};

    // Set default visibility for groups
    for (const group of groups) {
      if (group._id) {
        visibility[`group_${group._id.toString()}`] = true;
      }
    }

    // Set default visibility for pages and elements
    for (const page of pages) {
      if (page._id) {
        visibility[`page_${page._id.toString()}`] = true;
      }

      // Get elements for this page
      if (page.elements && page.elements.length > 0) {
        const elements = await ElementModel.find({
          _id: { $in: page.elements },
        });

        for (const element of elements) {
          if (element._id) {
            visibility[`element_${element._id.toString()}`] = true;
          }
        }
      }
    }

    // Process each condition
    for (const condition of conditions) {
      try {
        if (!condition.source_element_id) continue;

        const sourceValue = formData[condition.source_element_id.toString()];
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

    return NextResponse.json({ visibility });
  } catch (error: any) {
    console.error("Error evaluating conditions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to evaluate conditions" },
      { status: 500 }
    );
  }
}
