import { NextRequest, NextResponse } from "next/server";
import { FormRepository } from "@/lib/repositories/form-repository";

const formRepository = new FormRepository();

// GET /api/forms - Get all forms
export async function GET(): Promise<NextResponse> {
  try {
    const forms = await formRepository.getAllForms();

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
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.json();

    // Basic validation
    if (!data.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Create a new form
    const form = await formRepository.createForm({
      title: data.title,
      description: data.description || "",
      createdBy: data.owner_id || null
    });

    return NextResponse.json({ form }, { status: 201 });
  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json(
      { error: "Failed to create form" },
      { status: 500 }
    );
  }
}
