import { NextRequest, NextResponse } from "next/server";
import { initializePapr } from "@/lib/db";
import {
  FormModel,
  PageModel,
  ElementModel,
  FormValidationModel,
  ElementInstanceModel,
  FormPageModel,
} from "@/lib/models";
import { ObjectId } from "bson";

interface RouteParams {
  params: Promise<{
    formId: string;
  }>;
}

// GET /api/forms/[formId] - Get a form by ID with populated pages, elements, and validations
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Initialize Papr for this request
    await initializePapr();

    // Await the params Promise to get the formId
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
      // Get form-page junctions
      const formPages = await FormPageModel.find({
        form_id: form._id,
      });

      // Sort form-pages by order
      const sortedFormPages = formPages.sort(
        (a, b) => (a?.order || 0) - (b?.order || 0)
      );

      // Get page IDs from form-pages
      const pageIds = sortedFormPages
        .map((fp) => fp.page_id)
        .filter((id): id is ObjectId => id !== undefined);

      // Fetch pages
      const pages = await PageModel.find({
        _id: { $in: pageIds },
      });

      // Create a map of pages by ID for easy lookup
      const pagesMap = new Map(
        pages.map((page) => [page._id.toString(), page])
      );

      // Get all element instance IDs from all pages
      const allElementInstances = pages.flatMap(
        (page) => page.element_instances || []
      );
      const elementInstanceIds: ObjectId[] = [];
      for (const id of allElementInstances) {
        if (id) elementInstanceIds.push(id);
      }

      // Fetch element instances
      const elementInstances = await ElementInstanceModel.find({
        _id: { $in: elementInstanceIds },
      });

      // Get all template IDs from element instances
      const templateIds = elementInstances
        .map((instance) => instance.template_id)
        .filter((id): id is ObjectId => id !== undefined);

      // Fetch element templates
      const elementTemplates = await ElementModel.find({
        _id: { $in: templateIds },
      });

      // Create a map of templates by ID for easy lookup
      const templatesMap = new Map(
        elementTemplates.map((template) => [template._id.toString(), template])
      );

      // Create combined elements (template + instance)
      const combinedElements = elementInstances
        .map((instance) => {
          const template = templatesMap.get(
            instance.template_id?.toString() || ""
          );
          if (!template) return null;

          return {
            ...template,
            _id: instance._id,
            required: instance.required,
            order: instance.order,
            validations: instance.validations || [],
            label: instance.label_override || template.label,
            properties: {
              ...(template.properties || {}),
              ...(instance.properties_override || {}),
            },
          };
        })
        .filter(Boolean);

      // Create a map of combined elements by ID for easy lookup
      const elementsMap = new Map(
        combinedElements.map((element) => [
          element?._id.toString() || "",
          element,
        ])
      );

      // Fetch form validations
      const formValidations = await FormValidationModel.find({
        _id: { $in: form.form_validations || [] },
      });

      // Create populated pages with their elements
      const populatedPages = sortedFormPages
        .map((formPage) => {
          const page = pagesMap.get(formPage.page_id?.toString() || "");
          if (!page) return null;

          // Get element instances for this page
          const pageElementInstances = (page.element_instances || [])
            .map((instanceId) => elementsMap.get(instanceId.toString()))
            .filter(Boolean);

          // Sort elements by order
          const sortedPageElements = pageElementInstances.sort(
            (a, b) => (a?.order || 0) - (b?.order || 0)
          );

          return {
            ...page,
            elements: sortedPageElements,
            // Add form-page specific data
            conditions: formPage.conditions || [],
          };
        })
        .filter(Boolean);

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
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Initialize Papr for this request
    await initializePapr();

    // Await the params Promise to get the formId
    const { formId } = await params;

    // Validate ObjectId
    if (!ObjectId.isValid(formId)) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
    }

    const formId_obj = new ObjectId(formId);
    const data = await request.json();

    // Make sure the form exists
    const existingForm = await FormModel.findOne({ _id: formId_obj });
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
    data.version = (existingForm.version || 1) + 1;

    // Update form
    await FormModel.updateOne({ _id: formId_obj }, { $set: data });

    // Get updated form
    const updatedForm = await FormModel.findOne({ _id: formId_obj });

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
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Initialize Papr for this request
    await initializePapr();

    // Await the params Promise to get the formId
    const { formId } = await params;

    // Validate ObjectId
    if (!ObjectId.isValid(formId)) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
    }

    const formId_obj = new ObjectId(formId);

    // Check if form exists
    const form = await FormModel.findOne({ _id: formId_obj });
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Delete form
    await FormModel.deleteOne({ _id: formId_obj });

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
