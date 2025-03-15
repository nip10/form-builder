import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { ElementDocument } from "@/lib/schemas";
import { FormModel, ElementModel, PageModel } from "@/lib/models";

// POST /api/forms/[formId]/elements - Add element to a page
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId: formIdParam } = await params;
    // Validate form ID
    if (!ObjectId.isValid(formIdParam)) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
    }

    const formId = new ObjectId(formIdParam);
    const data = await request.json();

    // Validate required fields
    if (
      !data.pageId ||
      !data.element ||
      !data.element.type ||
      !data.element.label
    ) {
      return NextResponse.json(
        { error: "PageId, element type, and label are required" },
        { status: 400 }
      );
    }

    // Validate page ID
    if (!ObjectId.isValid(data.pageId)) {
      return NextResponse.json({ error: "Invalid page ID" }, { status: 400 });
    }

    // Find the form and page
    const form = await FormModel.findOne({ _id: formId });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (!form.pages) {
      return NextResponse.json({ error: "Form has no pages" }, { status: 404 });
    }

    const pageIndex = form.pages.findIndex(
      (pageId) => pageId.toString() === data.pageId
    );

    if (pageIndex === -1) {
      return NextResponse.json(
        { error: "Page not found in form" },
        { status: 404 }
      );
    }

    // Fetch the actual page document
    const page = await PageModel.findOne({ _id: new ObjectId(data.pageId) });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Create new element
    const newElement: ElementDocument = {
      _id: new ObjectId(),
      type: data.element.type,
      label: data.element.label,
      required: data.element.required || false,
      order: (page.elements?.length || 0) + 1,
      default_value: data.element.default_value,
      properties: data.element.properties || {},
      validations: data.element.validations || [],
    };

    // Save the element to the database
    await ElementModel.insertOne(newElement);

    // Add element reference to page
    await PageModel.updateOne(
      { _id: new ObjectId(data.pageId) },
      {
        $push: { elements: newElement._id },
      }
    );

    // Also update the form's updated_at timestamp
    await FormModel.updateOne(
      { _id: formId },
      { $set: { updated_at: new Date() } }
    );

    // Get updated form
    const updatedForm = await FormModel.findOne({ _id: formId });

    return NextResponse.json(
      {
        element: newElement,
        form: updatedForm,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding element:", error);
    return NextResponse.json(
      { error: "Failed to add element" },
      { status: 500 }
    );
  }
}
