import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { FormModel } from "@/lib/models";
import { FormDocument } from "@/lib/schemas";
import { initializePapr } from "@/lib/db";

// GET /api/forms - Get all forms
export async function GET() {
  try {
    await initializePapr();

    const forms = await FormModel.find(
      {},
      {
        projection: {
          _id: 1,
          title: 1,
          description: 1,
          created_at: 1,
          updated_at: 1,
          active: 1,
          version: 1,
        },
      }
    );

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
    await initializePapr();

    const data = await request.json();

    // Basic validation
    if (!data.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Create a new form with reference to the page
    const newForm: FormDocument = {
      _id: new ObjectId(),
      title: data.title,
      description: data.description || "",
      created_at: new Date(),
      updated_at: new Date(),
      active: true,
      version: 1,
      groups: [],
      pages: [],
      conditions: [],
      form_validations: [],
    };

    const result = await FormModel.insertOne(newForm);

    return NextResponse.json({ form: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json(
      { error: "Failed to create form" },
      { status: 500 }
    );
  }
}
