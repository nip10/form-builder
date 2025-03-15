import { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  pgTableCreator,
  text,
  timestamp,
  boolean,
  integer,
  primaryKey,
  pgEnum,
  jsonb,
  serial
} from "drizzle-orm/pg-core";

// Create table helper with prefix
export const createTable = pgTableCreator((name) => `form_builder_${name}`);

// Enums
export const elementTypeEnum = pgEnum('element_type', [
  'text_input', 'number_input', 'email', 'checkbox',
  'radio', 'select', 'textarea', 'image', 'text', 'date'
]);

export const validationTypeEnum = pgEnum('validation_type', [
  'jsonLogic', 'regex', 'custom'
]);

export const conditionActionEnum = pgEnum('condition_action', ['show', 'hide']);

export const targetTypeEnum = pgEnum('target_type', ['element', 'page', 'group']);

export const formStatusEnum = pgEnum('form_status', ['draft', 'published']);

// Type definitions for JSONB fields
type ElementProperties = {
  placeholder?: string;
  min?: number;
  max?: number;
  options?: string[];
  [key: string]: any;
};

type ValidationRule = {
  type: string;
  rule: any;
  error_message: string;
};

// 1. TEMPLATE TABLES
export const elementTemplate = createTable("element_template", {
  id: serial('id').primaryKey(),
  type: elementTypeEnum("type").notNull(),
  label: text("label").notNull(),
  defaultValue: text("default_value"),
  properties: jsonb("properties").$type<ElementProperties>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pageTemplate = createTable("page_template", {
  id: serial('id').primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  properties: jsonb("properties").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const groupTemplate = createTable("group_template", {
  id: serial('id').primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  properties: jsonb("properties").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 2. FORM DEFINITION AND VERSIONING
export const form = createTable("form", {
  id: serial('id').primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: formStatusEnum("status").notNull().default('draft'),
  currentVersion: integer("current_version").notNull().default(1),
  forkedFromId: integer("forked_from_id").notNull().references((): AnyPgColumn => form.id),
  forkDate: timestamp("fork_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: text("created_by"),
  properties: jsonb("properties").$type<Record<string, any>>().default({}),
});

export const formVersion = createTable("form_version", {
  id: serial('id').primaryKey(),
  formId: integer("form_id").notNull().references(() => form.id),
  version: integer("version").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
  structureSnapshot: jsonb("structure_snapshot").notNull().$type<Record<string, any>>(),
});

export const formPublishAudit = createTable("form_publish_audit", {
  id: serial('id').primaryKey(),
  formId: integer("form_id").notNull().references(() => form.id),
  version: integer("version").notNull(),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  publishedBy: text("published_by").notNull(),
  notes: text("notes"),
  previousStatus: text("previous_status").notNull(),
});

// 3. INSTANCE TABLES
export const groupInstance = createTable("group_instance", {
  id: serial('id').primaryKey(),
  templateId: integer("template_id").notNull().references(() => groupTemplate.id),
  formId: integer("form_id").notNull().references(() => form.id),
  orderIndex: integer("order_index").notNull(),
  titleOverride: text("title_override"),
  descriptionOverride: text("description_override"),
  propertiesOverride: jsonb("properties_override").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pageInstance = createTable("page_instance", {
  id: serial('id').primaryKey(),
  templateId: integer("template_id").notNull().references(() => pageTemplate.id),
  groupInstanceId: integer("group_instance_id").notNull().references(() => groupInstance.id),
  orderIndex: integer("order_index").notNull(),
  titleOverride: text("title_override"),
  descriptionOverride: text("description_override"),
  propertiesOverride: jsonb("properties_override").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const elementInstance = createTable("element_instance", {
  id: serial('id').primaryKey(),
  templateId: integer("template_id").notNull().references(() => elementTemplate.id),
  pageInstanceId: integer("page_instance_id").notNull().references(() => pageInstance.id),
  orderIndex: integer("order_index").notNull(),
  required: boolean("required").notNull().default(false),
  labelOverride: text("label_override"),
  propertiesOverride: jsonb("properties_override").$type<ElementProperties>().default({}),
  validations: jsonb("validations").$type<ValidationRule[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 4. VALIDATION AND CONDITIONAL LOGIC
export const formValidation = createTable("form_validation", {
  id: serial('id').primaryKey(),
  formId: integer("form_id").notNull().references(() => form.id),
  name: text("name").notNull(),
  rule: jsonb("rule").notNull(),
  errorMessage: text("error_message").notNull(),
  affectedElementInstances: jsonb("affected_element_instances").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const condition = createTable("condition", {
  id: serial('id').primaryKey(),
  formId: integer("form_id").notNull().references(() => form.id),
  name: text("name"),
  rule: jsonb("rule").notNull(),
  action: conditionActionEnum("action").notNull(),
  targetType: targetTypeEnum("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 5. FORM SUBMISSIONS
export const submission = createTable("submission", {
  id: serial('id').primaryKey(),
  formId: integer("form_id").notNull().references(() => form.id),
  formVersion: integer("form_version").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completed: boolean("completed").notNull().default(false),
  submittedBy: text("submitted_by"),
  data: jsonb("data").$type<Record<string, any>>().default({}),
});

// 6. CHANGE TRACKING
export const changeLog = createTable("change_log", {
  id: serial('id').primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  operation: text("operation").notNull(),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
  changedBy: text("changed_by"),
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
});

// Composite unique constraints
// These would be defined separately in Drizzle

// For tracking form version uniqueness
export const formVersionUnique = createTable(
  "form_version_unique",
  {
    formId: integer("form_id").notNull().references(() => form.id),
    version: integer("version").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.formId, t.version] }),
  ]
);

// For tracking form version in submissions
export const submissionFormVersion = createTable(
  "submission_form_version",
  {
    formId: integer("form_id").notNull().references(() => form.id),
    formVersion: integer("form_version").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.formId, t.formVersion] }),
  ]
);