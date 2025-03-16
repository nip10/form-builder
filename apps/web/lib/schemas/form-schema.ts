import { z } from "zod";

// Define the element properties schema
const elementPropertiesSchema = z
  .object({
    placeholder: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    options: z.array(z.string()).optional(),
  })
  .catchall(z.any());

// Define the validation rule schema
const validationRuleSchema = z.object({
  type: z.string(),
  rule: z.any(),
  error_message: z.string(),
});

// Define the form schema
export const formSchema = z.object({
  form: z.object({
    title: z.string().min(1, "Form title is required"),
    description: z.string().optional(),
    status: z.enum(["draft", "published"]).default("draft"),
    properties: z.record(z.any()).optional(),
  }),

  groups: z.array(
    z.object({
      id: z.string(),
      title: z.string().min(1, "Group title is required"),
      description: z.string().optional(),
      orderIndex: z.number(),
      properties: z.record(z.any()).optional(),
    }),
  ),

  pages: z.array(
    z.object({
      id: z.string(),
      title: z.string().min(1, "Page title is required"),
      description: z.string().optional(),
      groupId: z.string().min(1, "Group is required"),
      orderIndex: z.number(),
      properties: z.record(z.any()).optional(),
    }),
  ),

  elements: z.array(
    z.object({
      id: z.string(),
      type: z.enum([
        "text_input",
        "number_input",
        "email",
        "checkbox",
        "radio",
        "select",
        "textarea",
        "image",
        "text",
        "date",
      ]),
      label: z.string().min(1, "Element label is required"),
      pageId: z.string().min(1, "Page is required"),
      required: z.boolean().default(false),
      orderIndex: z.number(),
      properties: elementPropertiesSchema.optional(),
      validations: z.array(validationRuleSchema).optional(),
    }),
  ),
});
