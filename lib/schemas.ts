import { schema, types } from "papr";

// Element schema (form fields like inputs, images, text blocks)
const elementTypes = [
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
];
export type ElementType = (typeof elementTypes)[number];

const elementValidations = ["jsonLogic", "regex", "custom"];
export type ElementValidation = (typeof elementValidations)[number];

export const ElementSchema = schema(
  {
    type: types.enum(elementTypes),
    label: types.string(),
    required: types.boolean({ required: true }),
    order: types.number(),
    default_value: types.string(),
    properties: types.object(
      {},
      {
        additionalProperties: true, // Flexible properties based on element type
      }
    ),
    validations: types.array(
      types.object(
        {
          type: types.enum(elementValidations),
          rule: types.any(), // JSON Logic rule
          error_message: types.string(),
        },
        {
          required: false,
        }
      )
    ),
  },
  {
    defaults: {
      required: false,
      validations: [],
    },
  }
);
export type ElementDocument = (typeof ElementSchema)[0];
export type ElementOptions = (typeof ElementSchema)[1];

// Conditional logic schema
const operators = [
  "equals",
  "not_equals",
  "contains",
  "greater_than",
  "less_than",
];
export type Operator = (typeof operators)[number];

const conditionTypes = ["page", "element", "group"];
export type ConditionType = (typeof conditionTypes)[number];

const actions = ["show", "hide"];
export type Action = (typeof actions)[number];

export const ConditionSchema = schema({
  source_element_id: types.objectId(),
  operator: types.enum(operators),
  value: types.any(),
  action: types.enum(actions),
  target_id: types.objectId(),
  target_type: types.enum(conditionTypes),
});
export type ConditionDocument = (typeof ConditionSchema)[0];

// Page schema
export const PageSchema = schema(
  {
    title: types.string({ required: true }),
    description: types.string(),
    order: types.number(),
    active: types.boolean({ required: true }),
    group_id: types.objectId(),
    elements: types.array(types.objectId()),
  },
  {
    defaults: {
      active: true,
      elements: [],
    },
  }
);
export type PageDocument = (typeof PageSchema)[0];

// Group schema (collections of pages)
export const GroupSchema = schema({
  title: types.string({ required: true }),
  description: types.string(),
  order: types.number(),
});
export type GroupDocument = (typeof GroupSchema)[0];

// Advanced validation schema (form-level validations)
export const FormValidationSchema = schema({
  name: types.string({ required: true }),
  rule: types.object(
    {},
    {
      required: true,
      additionalProperties: true, // JSON Logic rule structure
    }
  ),
  error_message: types.string(),
  affected_elements: types.array(types.objectId()),
});
export type FormValidationDocument = (typeof FormValidationSchema)[0];

// Main form schema
export const FormSchema = schema(
  {
    title: types.string({ required: true }),
    description: types.string(),
    created_at: types.date({ required: true }),
    updated_at: types.date({ required: true }),
    active: types.boolean({ required: true }),
    version: types.number({ required: true }),
    groups: types.array(types.objectId()),
    pages: types.array(types.objectId()),
    conditions: types.array(types.objectId()),
    form_validations: types.array(types.objectId()),
  },
  {
    defaults: {
      created_at: new Date(),
      updated_at: new Date(),
      active: true,
      version: 1,
      groups: [],
      pages: [],
      conditions: [],
      form_validations: [],
    },
  }
);
export type FormDocument = (typeof FormSchema)[0];
export type FormOptions = (typeof FormSchema)[1];

// Form submissions schema
export const SubmissionSchema = schema(
  {
    form_id: types.objectId(),
    created_at: types.date({ required: true }),
    completed: types.boolean({ required: true }),
    data: types.object(
      {},
      {
        additionalProperties: true, // Flexible structure for submission data
      }
    ),
  },
  {
    defaults: {
      created_at: new Date(),
      completed: false,
    },
  }
);
export type SubmissionDocument = (typeof SubmissionSchema)[0];
export type SubmissionOptions = (typeof SubmissionSchema)[1];
