import { NextRequest, NextResponse } from "next/server";
import { FormRepository } from "@/lib/repositories/form-repository";
import { formSchema } from "@/lib/schemas/form-schema";
import { db } from "@repo/database";
import {
  ElementTemplateTable,
  PageTemplateTable,
  GroupTemplateTable,
  FormTable,
  GroupInstanceTable,
  PageInstanceTable,
  ElementInstanceTable,
} from "@repo/database/src/schema";
import { eq } from "drizzle-orm";

const formRepository = new FormRepository();

// POST /api/forms/builder - Create a new form with groups, pages, and elements
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate the request body
    const requestData = await request.json();
    const formResult = formSchema.safeParse(requestData);

    if (!formResult.success) {
      return NextResponse.json(
        {
          error: "Invalid form data",
          details: formResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { form: formData, groups, pages, elements } = formResult.data;

    // Create the base form
    const createdForm = await formRepository.createForm({
      title: formData.title,
      description: formData.description || "",
    });

    const formId = createdForm.id;

    // Step 1: Create Group Templates and Instances
    const groupIdMap = new Map<string, number>(); // Maps original group IDs to created instance IDs

    for (const group of groups) {
      if (!group) {
        throw new Error("Group is undefined");
      }

      // Create Group Template first
      const [groupTemplate] = await db
        .insert(GroupTemplateTable)
        .values({
          title: group.title,
          description: group.description,
          properties: group.properties,
        })
        .returning();

      if (!groupTemplate) {
        throw new Error("Failed to create group template");
      }

      // Then create Group Instance
      const [groupInstance] = await db
        .insert(GroupInstanceTable)
        .values({
          templateId: groupTemplate.id,
          formId: formId,
          orderIndex: group.orderIndex,
          title: group.title,
          description: group.description,
          properties: group.properties,
        })
        .returning();

      if (!groupInstance) {
        throw new Error("Failed to create group instance");
      }

      // Store the mapping safely
      if (group.id) {
        groupIdMap.set(group.id, groupInstance.id);
      }
    }

    // Step 2: Create Page Templates and Instances
    const pageIdMap = new Map<string, number>(); // Maps original page IDs to created instance IDs

    for (const page of pages) {
      if (!page) {
        throw new Error("Page is undefined");
      }

      const groupInstanceId = page.groupId ? groupIdMap.get(page.groupId) : undefined;
      if (!groupInstanceId) {
        throw new Error(`Group ID ${page.groupId} not found`);
      }

      // Create Page Template first
      const [pageTemplate] = await db
        .insert(PageTemplateTable)
        .values({
          title: page.title,
          description: page.description,
          properties: page.properties,
        })
        .returning();

      if (!pageTemplate) {
        throw new Error("Failed to create page template");
      }

      // Then create Page Instance
      const [pageInstance] = await db
        .insert(PageInstanceTable)
        .values({
          templateId: pageTemplate.id,
          groupInstanceId: groupInstanceId,
          orderIndex: page.orderIndex,
          title: page.title,
          description: page.description,
          properties: page.properties,
        })
        .returning();

      if (!pageInstance) {
        throw new Error("Failed to create page instance");
      }

      // Store the mapping safely
      if (page.id) {
        pageIdMap.set(page.id, pageInstance.id);
      }
    }

    // Step 3: Create Element Templates and Instances
    for (const element of elements) {
      const pageInstanceId = element.pageId ? pageIdMap.get(element.pageId) : undefined;
      if (!pageInstanceId) {
        throw new Error(`Page ID ${element.pageId} not found`);
      }

      // Create Element Template
      const [elementTemplate] = await db
        .insert(ElementTemplateTable)
        .values({
          type: element.type,
          label: element.label,
          defaultValue: null, // Set default value to null if not provided
          properties: element.properties,
        })
        .returning();

      if (!elementTemplate) {
        throw new Error("Failed to create element template");
      }

      // Then create Element Instance
      const [elementInstance] = await db
        .insert(ElementInstanceTable)
        .values({
          templateId: elementTemplate.id,
          pageInstanceId: pageInstanceId,
          orderIndex: element.orderIndex,
          label: element.label, // Can be null/undefined as per schema
          properties: element.properties,
        })
        .returning();

      if (!elementInstance) {
        throw new Error("Failed to create element instance");
      }
    }

    // Update the form's updated_at timestamp
    await db.update(FormTable).set({ updatedAt: new Date() }).where(eq(FormTable.id, formId));

    // Return the created form with an ID
    return NextResponse.json(
      {
        form: {
          id: formId,
          ...formData,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json(
      { error: "Failed to create form", details: (error as Error).message },
      { status: 500 },
    );
  }
}
