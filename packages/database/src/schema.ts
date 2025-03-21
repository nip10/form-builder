import { InferInsertModel, InferSelectModel } from "drizzle-orm";
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
  serial,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `form_builder_${name}`);

export const elementTypeEnum = pgEnum("element_type", [
  "text_input",
  "number_input",
  "checkbox",
  "checkbox_group",
  "radio",
  "radio_group",
  "select",
  "textarea",
  "image",
  "date",
  "range",
  "rating",
  "slider",
  "switch",
  "toggle",
]);

export const validationTypeEnum = pgEnum("validation_type", ["jsonLogic", "regex"]);

export const conditionActionEnum = pgEnum("condition_action", ["show", "hide", "enforce_order"]);

export const targetTypeEnum = pgEnum("target_type", ["element", "page", "group"]);

export const formStatusEnum = pgEnum("form_status", ["draft", "published"]);

// Type definitions for JSONB fields
type ElementProperties = {
  placeholder?: string;
  min?: number;
  max?: number;
  options?: string[];
  [key: string]: any;
};

type ValidationRule = {
  type: string; // jsonLogic, regex, etc.
  rule: any; // jsonLogic, regex, etc.
  error_message: string; // error message to display if the rule is violated
};

// 1. TEMPLATE TABLES
export const ElementTemplateTable = createTable("element_template", {
  id: serial("id").primaryKey(),
  type: elementTypeEnum("type").notNull(),
  label: text("label"),
  defaultValue: text("default_value"),
  required: boolean("required").notNull().default(true),
  validations: jsonb("validations").$type<ValidationRule[]>().default([]),
  properties: jsonb("properties").$type<ElementProperties>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export type ElementTemplate = InferSelectModel<typeof ElementTemplateTable>;
export type NewElementTemplate = InferInsertModel<typeof ElementTemplateTable>;

export const PageTemplateTable = createTable("page_template", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  validations: jsonb("validations").$type<ValidationRule[]>().default([]),
  properties: jsonb("properties").$type<Record<string, any>>().default({}), // not used yet
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export type PageTemplate = InferSelectModel<typeof PageTemplateTable>;
export type NewPageTemplate = InferInsertModel<typeof PageTemplateTable>;

export const GroupTemplateTable = createTable("group_template", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  validations: jsonb("validations").$type<ValidationRule[]>().default([]),
  properties: jsonb("properties").$type<Record<string, any>>().default({}), // not used yet
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export type GroupTemplate = InferSelectModel<typeof GroupTemplateTable>;
export type NewGroupTemplate = InferInsertModel<typeof GroupTemplateTable>;

// 2. FORM DEFINITION AND VERSIONING
export const FormTable = createTable("form", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: formStatusEnum("status").notNull().default("draft"),
  currentVersion: integer("current_version").notNull().default(1),
  forkedFromId: integer("forked_from_id").references((): AnyPgColumn => FormTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  properties: jsonb("properties").$type<Record<string, any>>().default({}), // not used yet
});
export type Form = InferSelectModel<typeof FormTable>;
export type NewForm = InferInsertModel<typeof FormTable>;

export const FormVersionTable = createTable("form_version", {
  id: serial("id").primaryKey(),
  formId: integer("form_id")
    .notNull()
    .references(() => FormTable.id),
  version: integer("version").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
  structureSnapshot: jsonb("structure_snapshot").notNull().$type<Record<string, any>>(),
});
export type FormVersion = InferSelectModel<typeof FormVersionTable>;
export type NewFormVersion = InferInsertModel<typeof FormVersionTable>;

export const FormPublishAuditTable = createTable("form_publish_audit", {
  id: serial("id").primaryKey(),
  formId: integer("form_id")
    .notNull()
    .references(() => FormTable.id),
  version: integer("version").notNull(),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  publishedBy: text("published_by").notNull(),
  notes: text("notes"),
});
export type FormPublishAudit = InferSelectModel<typeof FormPublishAuditTable>;
export type NewFormPublishAudit = InferInsertModel<typeof FormPublishAuditTable>;

// 3. INSTANCE TABLES
export const GroupInstanceTable = createTable("group_instance", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id")
    .notNull()
    .references(() => GroupTemplateTable.id),
  formId: integer("form_id")
    .notNull()
    .references(() => FormTable.id),
  orderIndex: integer("order_index").notNull(),
  title: text("title"),
  description: text("description"),
  properties: jsonb("properties").$type<Record<string, any>>().default({}), // not used yet
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export type GroupInstance = InferSelectModel<typeof GroupInstanceTable>;
export type NewGroupInstance = InferInsertModel<typeof GroupInstanceTable>;

export const PageInstanceTable = createTable("page_instance", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id")
    .notNull()
    .references(() => PageTemplateTable.id),
  groupInstanceId: integer("group_instance_id")
    .notNull()
    .references(() => GroupInstanceTable.id),
  orderIndex: integer("order_index").notNull(),
  title: text("title"),
  description: text("description"),
  properties: jsonb("properties").$type<Record<string, any>>().default({}), // not used yet
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export type PageInstance = InferSelectModel<typeof PageInstanceTable>;
export type NewPageInstance = InferInsertModel<typeof PageInstanceTable>;

export const ElementInstanceTable = createTable("element_instance", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id")
    .notNull()
    .references(() => ElementTemplateTable.id),
  pageInstanceId: integer("page_instance_id")
    .notNull()
    .references(() => PageInstanceTable.id),
  orderIndex: integer("order_index").notNull(),
  label: text("label"),
  properties: jsonb("properties").$type<ElementProperties>().default({}), // not used yet
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export type ElementInstance = InferSelectModel<typeof ElementInstanceTable>;
export type NewElementInstance = InferInsertModel<typeof ElementInstanceTable>;

// 4. VALIDATION AND CONDITIONAL LOGIC
export const FormValidationTable = createTable("form_validation", {
  id: serial("id").primaryKey(),
  formId: integer("form_id")
    .notNull()
    .references(() => FormTable.id),
  name: text("name").notNull(),
  rule: jsonb("rule").notNull(), // json logic
  errorMessage: text("error_message").notNull(),
  affectedElementInstances: jsonb("affected_element_instances").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export type FormValidation = InferSelectModel<typeof FormValidationTable>;
export type NewFormValidation = InferInsertModel<typeof FormValidationTable>;

export const ConditionTable = createTable("condition", {
  id: serial("id").primaryKey(),
  formId: integer("form_id")
    .notNull()
    .references(() => FormTable.id),
  name: text("name"),
  rule: jsonb("rule").notNull(), // json logic
  action: conditionActionEnum("action").notNull(),
  targetType: targetTypeEnum("target_type").notNull(),
  targetId: integer("target_id").notNull(), // elementInstanceId, pageInstanceId, groupInstanceId
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export type Condition = InferSelectModel<typeof ConditionTable>;
export type NewCondition = InferInsertModel<typeof ConditionTable>;

// 6. CHANGE TRACKING
export const ChangeLogTable = createTable("change_log", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  operation: text("operation").notNull(),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
  changedBy: text("changed_by"),
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
});
export type ChangeLog = InferSelectModel<typeof ChangeLogTable>;
export type NewChangeLog = InferInsertModel<typeof ChangeLogTable>;

// Composite unique constraints

// For tracking form version uniqueness
export const formVersionUnique = createTable(
  "form_version_unique",
  {
    formId: integer("form_id")
      .notNull()
      .references(() => FormTable.id),
    version: integer("version").notNull(),
  },
  (t) => [primaryKey({ columns: [t.formId, t.version] })],
);

// For tracking form version in submissions
export const submissionFormVersion = createTable(
  "submission_form_version",
  {
    formId: integer("form_id")
      .notNull()
      .references(() => FormTable.id),
    formVersion: integer("form_version").notNull(),
  },
  (t) => [primaryKey({ columns: [t.formId, t.formVersion] })],
);

// 7. FORM SUBMISSIONS AND RESPONSES
export const FormSubmissionTable = createTable("form_submission", {
  id: serial("id").primaryKey(),
  formId: integer("form_id")
    .notNull()
    .references(() => FormTable.id),
  formVersion: integer("form_version").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  submittedBy: text("submitted_by"),
  status: text("status").notNull().default("completed"), // completed, partial, abandoned
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export type FormSubmission = InferSelectModel<typeof FormSubmissionTable>;
export type NewFormSubmission = InferInsertModel<typeof FormSubmissionTable>;

export const FormResponseTable = createTable("form_response", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id")
    .notNull()
    .references(() => FormSubmissionTable.id),
  elementInstanceId: integer("element_instance_id")
    .notNull()
    .references(() => ElementInstanceTable.id),
  value: jsonb("value").notNull(), // Stores the actual response value
  isValid: boolean("is_valid").notNull().default(true),
  validationErrors: jsonb("validation_errors").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export type FormResponse = InferSelectModel<typeof FormResponseTable>;
export type NewFormResponse = InferInsertModel<typeof FormResponseTable>;
