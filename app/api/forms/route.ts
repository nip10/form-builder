import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { FormModel, PageModel } from "@/lib/models";
import { FormDocument } from "@/lib/schemas";
// GET /api/forms - Get all forms
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ownerId = searchParams.get("ownerId");

    let query = {};
    if (ownerId) {
      query = { owner_id: ownerId };
    }

    const forms = await FormModel.find(query, {
      projection: {
        _id: 1,
        title: 1,
        description: 1,
        created_at: 1,
        updated_at: 1,
        active: 1,
        version: 1,
      },
    });

    return NextResponse.json({ forms });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}

// POST /api/forms - Create a new form
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Basic validation
    if (!data.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Create a default first page
    const firstPageId = new ObjectId();
    const firstPage = {
      _id: firstPageId,
      title: "Page 1",
      description: "",
      order: 1,
      active: true,
      elements: [],
    };

    // Insert the page
    await PageModel.insertOne(firstPage);

    // Create a new form with reference to the page
    const newForm: Partial<FormDocument> = {
      title: data.title,
      description: data.description || "",
      created_at: new Date(),
      updated_at: new Date(),
      active: true,
      version: 1,
      groups: [],
      pages: [firstPageId],
      conditions: [],
      form_validations: [],
    };

    // Store owner_id as a custom field if needed
    if (data.owner_id) {
      (newForm as any).owner_id = data.owner_id;
    }

    const result = await FormModel.insertOne(newForm as any);
    const insertedForm = await FormModel.findOne({ _id: result._id });

    return NextResponse.json({ form: insertedForm }, { status: 201 });
  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json(
      { error: "Failed to create form" },
      { status: 500 }
    );
  }
}
