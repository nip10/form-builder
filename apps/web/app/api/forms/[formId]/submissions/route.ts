import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { SubmissionTable } from "@repo/database/src/schema";
import { FormRepository } from "@/lib/repositories/form-repository";
import { eq } from "drizzle-orm";
import { z } from "zod";

interface RouteParams {
  params: {
    formId: string;
  };
}

const formRepository = new FormRepository();

// Zod schema for form ID validation
const formIdSchema = z.coerce.number().int().positive();

// Zod schema for submission data
const submissionSchema = z.object({
  completed: z.boolean().optional().default(true),
  data: z.record(z.any()).default({}),
  submittedBy: z.string().optional()
});

// GET /api/forms/[formId]/submissions - Get all submissions for a form
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate and parse the form ID
    const formIdResult = formIdSchema.safeParse(params.formId);

    if (!formIdResult.success) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
    }

    const formId = formIdResult.data;

    // Get submissions for form
    const submissions = await db.query.SubmissionTable.findMany({
      where: eq(SubmissionTable.formId, formId)
    });

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
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate and parse the form ID
    const formIdResult = formIdSchema.safeParse(params.formId);

    if (!formIdResult.success) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
    }

    const formId = formIdResult.data;

    // Parse and validate the request body
    const requestData = await request.json();
    const submissionResult = submissionSchema.safeParse(requestData);

    if (!submissionResult.success) {
      return NextResponse.json(
        {
          error: "Invalid submission data",
          details: submissionResult.error.format()
        },
        { status: 400 }
      );
    }

    const submissionData = submissionResult.data;

    // Get form for validation
    const form = await formRepository.getFormById(formId);

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // TODO: Implement validation logic for SQL database
    // For now, we'll just create the submission without validation

    // Create submission
    const [submission] = await db.insert(SubmissionTable)
      .values({
        formId: formId,
        formVersion: form.currentVersion,
        completed: submissionData.completed,
        data: submissionData.data,
        createdAt: new Date(),
        submittedBy: submissionData.submittedBy
      })
      .returning();

    if (!submission) {
      return NextResponse.json(
        { error: "Failed to create submission" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        submission_id: submission.id,
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
