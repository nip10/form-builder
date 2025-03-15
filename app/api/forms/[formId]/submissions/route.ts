import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { FormModel, SubmissionModel } from "@/lib/models";
import { validateFormSubmission } from "@/lib/validation";
import { initializePapr } from "@/lib/db";
import { SubmissionDocument } from "@/lib/schemas";

// GET /api/forms/[formId]/submissions - Get all submissions for a form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    await initializePapr();

    const { formId: formIdParam } = await params;
    // Validate form ID
    if (!ObjectId.isValid(formIdParam)) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
    }

    const formId = new ObjectId(formIdParam);

    // Get submissions for form
    const submissions = await SubmissionModel.find({ form_id: formId });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

// POST /api/forms/[formId]/submissions - Create a new submission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    await initializePapr();

    const { formId: formIdParam } = await params;
    // Validate form ID
    if (!ObjectId.isValid(formIdParam)) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
    }

    const formId = new ObjectId(formIdParam);
    const submissionData = await request.json();

    // Get form for validation
    const form = await FormModel.findOne({ _id: formId });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Validate submission data
    const validationResult = await validateFormSubmission(
      form,
      submissionData.data
    );

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          error: "Validation failed",
          validationErrors: validationResult.errors,
        },
        { status: 400 }
      );
    }

    // Create submission
    const newSubmission: SubmissionDocument = {
      _id: new ObjectId(),
      form_id: formId,
      created_at: new Date(),
      completed: submissionData.completed || true,
      data: submissionData.data,
    };

    const result = await SubmissionModel.insertOne(newSubmission);

    return NextResponse.json(
      {
        submission_id: result._id,
        message: "Submission created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}
