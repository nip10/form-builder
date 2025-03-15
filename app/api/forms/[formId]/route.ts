import { NextRequest, NextResponse } from "next/server";
import { initializePapr } from "@/lib/db";
import {
  FormModel,
  PageModel,
  ElementModel,
  FormValidationModel,
} from "@/lib/models";
import { ObjectId } from "bson";

// GET /api/forms/[formId] - Get a form by ID with populated pages, elements, and validations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    await initializePapr();

    const { formId } = await params;

    // Check if we should populate the form
    const shouldPopulate =
      request.nextUrl.searchParams.get("populate") === "true";

    if (!ObjectId.isValid(formId)) {
      return NextResponse.json(
        { error: "Invalid form ID format" },
        { status: 400 }
      );
    }

    const form = await FormModel.findOne({ _id: new ObjectId(formId) });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // If populate=true, fetch all related data
    if (shouldPopulate) {
      // Fetch pages
      const pages = await PageModel.find({
        _id: { $in: form.pages || [] },
      });

      // Sort pages by order
      const sortedPages = pages.toSorted(
        (a, b) => (a?.order || 0) - (b?.order || 0)
      );

      // Fetch elements for all pages
      const elementIds = sortedPages.flatMap((page) => page.elements || []);
      const elements = await ElementModel.find({
        _id: { $in: elementIds },
      });

      // Sort elements by order
      const sortedElements = elements.toSorted(
        (a, b) => (a?.order || 0) - (b?.order || 0)
      );

      // Fetch form validations
      const formValidations = await FormValidationModel.find({
        _id: { $in: form.form_validations || [] },
      });

      // Populate pages with their elements
      const populatedPages = sortedPages.map((page) => ({
        ...page,
        elements: (page.elements || [])
          .map((elementId) =>
            sortedElements.find(
              (e) => e._id.toString() === elementId.toString()
            )
          )
          .filter(Boolean)
          .toSorted((a, b) => (a?.order || 0) - (b?.order || 0)),
      }));

      // Return the populated form
      return NextResponse.json({
        form: {
          ...form,
          pages: populatedPages,
          form_validations: formValidations,
        },
      });
    }

    // Return the form without population
    return NextResponse.json({ form });
  } catch (error: any) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch form" },
      { status: 500 }
    );
  }
}

// PUT /api/forms/[formId] - Update a form
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId: formIdParam } = await params;

    await initializePapr();

    // Validate ObjectId
    if (!ObjectId.isValid(formIdParam)) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
    }

    const formId = new ObjectId(formIdParam);
    const data = await request.json();

    // Make sure the form exists
    const existingForm = await FormModel.findOne({ _id: formId });
    if (!existingForm) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Prevent changing form _id
    if (data._id) {
      delete data._id;
    }

    // Update timestamps
    data.updated_at = new Date();

    // Increment version
    data.version = existingForm.version + 1;

    // Update form
    await FormModel.updateOne({ _id: formId }, { $set: data });

    // Get updated form
    const updatedForm = await FormModel.findOne({ _id: formId });

    return NextResponse.json({ form: updatedForm });
  } catch (error) {
    console.error("Error updating form:", error);
    return NextResponse.json(
      { error: "Failed to update form" },
      { status: 500 }
    );
  }
}

// DELETE /api/forms/[formId] - Delete a form
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId: formIdParam } = await params;

    await initializePapr();

    // Validate ObjectId
    if (!ObjectId.isValid(formIdParam)) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
    }

    const formId = new ObjectId(formIdParam);

    // Check if form exists
    const form = await FormModel.findOne({ _id: formId });
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Delete form
    await FormModel.deleteOne({ _id: formId });

    return NextResponse.json(
      { message: "Form deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json(
      { error: "Failed to delete form" },
      { status: 500 }
    );
  }
}
