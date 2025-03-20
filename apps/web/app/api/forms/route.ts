import { NextRequest, NextResponse } from "next/server";
import { FormRepository } from "@/lib/repositories/form-repository";
import { z } from "zod";

const formRepository = new FormRepository();

// Zod schema for form creation
const createFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  owner_id: z.string().optional().nullable(),
});

// GET /api/forms - Get all forms
export async function GET(): Promise<NextResponse> {
  try {
    const forms = await formRepository.getAllForms();

    return NextResponse.json({ forms });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json({ error: "Failed to fetch forms" }, { status: 500 });
  }
}

// POST /api/forms - Create a new form
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate the request body
    const requestData = await request.json();
    const formResult = createFormSchema.safeParse(requestData);

    if (!formResult.success) {
      return NextResponse.json(
        {
          error: "Invalid form data",
          details: formResult.error.format(),
        },
        { status: 400 },
      );
    }

    const data = formResult.data;

    // Create a new form
    const form = await formRepository.createForm({
      title: data.title,
      description: data.description,
    });

    return NextResponse.json({ form }, { status: 201 });
  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json({ error: "Failed to create form" }, { status: 500 });
  }
}
