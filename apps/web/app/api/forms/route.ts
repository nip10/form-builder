import { NextRequest, NextResponse } from "next/server";
import { FormModel } from "@/lib/models";
import { FormDocument, FormOptions } from "@/lib/schemas";
import { initializePapr } from "@/lib/db";
import { DocumentForInsert } from "papr";

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
    const newForm: DocumentForInsert<FormDocument, FormOptions> = {
      title: data.title,
      description: data.description || "",
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
