import { NextRequest, NextResponse } from "next/server";
import { FormRepository } from "@/lib/repositories/form-repository";
import { z } from "zod";
import { formStatusEnum } from "@repo/database/src/schema";

interface RouteParams {
  params: Promise<{
    formId: string;
  }>;
}

const formRepository = new FormRepository();

// Zod schema for form ID validation
const formIdSchema = z.coerce.number().int().positive();

// Zod schema for form update data
const formUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(formStatusEnum.enumValues).optional(),
});

// GET /api/forms/[formId] - Get a form by ID with populated pages, elements, and validations
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Await the params Promise directly
    const resolvedParams = await params;

    // Validate and parse the form ID
    const formIdResult = formIdSchema.safeParse(resolvedParams.formId);

    if (!formIdResult.success) {
      return NextResponse.json({ error: "Invalid form ID format" }, { status: 400 });
    }

    const formId = formIdResult.data;

    // Check if we should populate the form
    const shouldPopulate = request.nextUrl.searchParams.get("populate") === "true";

    if (shouldPopulate) {
      // Get form with all relations
      const form = await formRepository.getFormWithRelations(formId);

      if (!form) {
        return NextResponse.json({ error: "Form not found" }, { status: 404 });
      }

      return NextResponse.json({ form });
    }

    // Get form without relations
    const form = await formRepository.getFormById(formId);

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json({ form });
  } catch (error: any) {
    console.error("Error fetching form:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch form" }, { status: 500 });
  }
}

// PUT /api/forms/[formId] - Update a form
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Await the params Promise directly
    const resolvedParams = await params;

    // Validate and parse the form ID
    const formIdResult = formIdSchema.safeParse(resolvedParams.formId);

    if (!formIdResult.success) {
      return NextResponse.json({ error: "Invalid form ID format" }, { status: 400 });
    }

    const formId = formIdResult.data;

    // Parse and validate the request body
    const requestData = await request.json();
    const dataResult = formUpdateSchema.safeParse(requestData);

    if (!dataResult.success) {
      return NextResponse.json(
        {
          error: "Invalid form data",
          details: dataResult.error.format(),
        },
        { status: 400 },
      );
    }

    const data = dataResult.data;

    // Make sure the form exists
    const existingForm = await formRepository.getFormById(formId);
    if (!existingForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Update form
    const updatedForm = await formRepository.updateForm(formId, data);

    return NextResponse.json({ form: updatedForm });
  } catch (error) {
    console.error("Error updating form:", error);
    return NextResponse.json({ error: "Failed to update form" }, { status: 500 });
  }
}

// DELETE /api/forms/[formId] - Delete a form
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Await the params Promise directly
    const resolvedParams = await params;

    // Validate and parse the form ID
    const formIdResult = formIdSchema.safeParse(resolvedParams.formId);

    if (!formIdResult.success) {
      return NextResponse.json({ error: "Invalid form ID format" }, { status: 400 });
    }

    const formId = formIdResult.data;

    // Check if form exists
    const form = await formRepository.getFormById(formId);
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Delete form
    const success = await formRepository.deleteForm(formId);

    if (success) {
      return NextResponse.json({ message: "Form deleted successfully" }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Failed to delete form" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json({ error: "Failed to delete form" }, { status: 500 });
  }
}
