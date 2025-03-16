import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@repo/database";
import {
  FormTable,
  ElementInstanceTable,
  PageInstanceTable,
  ElementTemplateTable,
  elementTypeEnum,
} from "@repo/database/src/schema";
import { eq } from "drizzle-orm";
import { FormRepository } from "@/lib/repositories/form-repository";

interface RouteParams {
  params: {
    formId: string;
  };
}

const formRepository = new FormRepository();

// Zod schema for form ID validation
const formIdSchema = z.coerce.number().int().positive();

// Zod schema for page ID validation
const pageIdSchema = z.coerce.number().int().positive();

// Zod schema for element creation
const elementSchema = z.object({
  pageId: pageIdSchema,
  element: z.object({
    type: z.enum(elementTypeEnum.enumValues),
    label: z.string().min(1, "Label is required"),
    required: z.boolean().optional().default(false),
    default_value: z.string().optional(),
    properties: z.record(z.any()).optional().default({}),
    validations: z.array(z.any()).optional().default([]),
  }),
});

// POST /api/forms/[formId]/elements - Add element to a page
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
    const validationResult = elementSchema.safeParse(requestData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid element data",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { pageId, element } = validationResult.data;

    // Check if form exists
    const form = await db.query.FormTable.findFirst({
      where: eq(FormTable.id, formId),
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Check if page exists and belongs to the form
    const page = await db.query.PageInstanceTable.findFirst({
      where: eq(PageInstanceTable.id, pageId),
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Create a new element template first
    const [newElementTemplate] = await db
      .insert(ElementTemplateTable)
      .values({
        type: element.type,
        label: element.label,
        defaultValue: element.default_value,
        properties: element.properties,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!newElementTemplate) {
      return NextResponse.json({ error: "Failed to create element template" }, { status: 500 });
    }

    // Get the count of existing elements for ordering
    const existingElements = await db.query.ElementInstanceTable.findMany({
      where: eq(ElementInstanceTable.pageInstanceId, pageId),
    });

    // Create the element instance
    const [newElementInstance] = await db
      .insert(ElementInstanceTable)
      .values({
        templateId: newElementTemplate.id,
        pageInstanceId: pageId,
        orderIndex: existingElements.length + 1,
        required: element.required,
        validations: element.validations,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!newElementInstance) {
      return NextResponse.json({ error: "Failed to create element instance" }, { status: 500 });
    }

    // Update the form's updated_at timestamp
    await db.update(FormTable).set({ updatedAt: new Date() }).where(eq(FormTable.id, formId));

    // Get the updated form with relations
    const updatedForm = await formRepository.getFormWithRelations(formId);

    return NextResponse.json(
      {
        element: {
          ...newElementTemplate,
          instance: newElementInstance,
        },
        form: updatedForm,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error adding element:", error);
    return NextResponse.json({ error: "Failed to add element" }, { status: 500 });
  }
}
