CREATE TYPE "public"."condition_action" AS ENUM('show', 'hide');--> statement-breakpoint
CREATE TYPE "public"."element_type" AS ENUM('text_input', 'number_input', 'email', 'checkbox', 'radio', 'select', 'textarea', 'image', 'text', 'date');--> statement-breakpoint
CREATE TYPE "public"."form_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."target_type" AS ENUM('element', 'page', 'group');--> statement-breakpoint
CREATE TYPE "public"."validation_type" AS ENUM('jsonLogic', 'regex', 'custom');--> statement-breakpoint
CREATE TABLE "form_builder_change_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"operation" text NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"changed_by" text,
	"previous_value" jsonb,
	"new_value" jsonb
);
--> statement-breakpoint
CREATE TABLE "form_builder_condition" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_id" integer NOT NULL,
	"name" text,
	"rule" jsonb NOT NULL,
	"action" "condition_action" NOT NULL,
	"target_type" "target_type" NOT NULL,
	"target_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_builder_element_instance" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"page_instance_id" integer NOT NULL,
	"order_index" integer NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"label_override" text,
	"properties_override" jsonb DEFAULT '{}'::jsonb,
	"validations" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_builder_element_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "element_type" NOT NULL,
	"label" text NOT NULL,
	"default_value" text,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_builder_form" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "form_status" DEFAULT 'draft' NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"forked_from_id" integer NOT NULL,
	"fork_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	"properties" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "form_builder_form_publish_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_id" integer NOT NULL,
	"version" integer NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"published_by" text NOT NULL,
	"notes" text,
	"previous_status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_builder_form_validation" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_id" integer NOT NULL,
	"name" text NOT NULL,
	"rule" jsonb NOT NULL,
	"error_message" text NOT NULL,
	"affected_element_instances" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_builder_form_version" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_id" integer NOT NULL,
	"version" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"structure_snapshot" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_builder_form_version_unique" (
	"form_id" integer NOT NULL,
	"version" integer NOT NULL,
	CONSTRAINT "form_builder_form_version_unique_form_id_version_pk" PRIMARY KEY("form_id","version")
);
--> statement-breakpoint
CREATE TABLE "form_builder_group_instance" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"form_id" integer NOT NULL,
	"order_index" integer NOT NULL,
	"title_override" text,
	"description_override" text,
	"properties_override" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_builder_group_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_builder_page_instance" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"group_instance_id" integer NOT NULL,
	"order_index" integer NOT NULL,
	"title_override" text,
	"description_override" text,
	"properties_override" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_builder_page_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_builder_submission" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_id" integer NOT NULL,
	"form_version" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"submitted_by" text,
	"data" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "form_builder_submission_form_version" (
	"form_id" integer NOT NULL,
	"form_version" integer NOT NULL,
	CONSTRAINT "form_builder_submission_form_version_form_id_form_version_pk" PRIMARY KEY("form_id","form_version")
);
--> statement-breakpoint
ALTER TABLE "form_builder_condition" ADD CONSTRAINT "form_builder_condition_form_id_form_builder_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_builder_form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_element_instance" ADD CONSTRAINT "form_builder_element_instance_template_id_form_builder_element_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."form_builder_element_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_element_instance" ADD CONSTRAINT "form_builder_element_instance_page_instance_id_form_builder_page_instance_id_fk" FOREIGN KEY ("page_instance_id") REFERENCES "public"."form_builder_page_instance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_form" ADD CONSTRAINT "form_builder_form_forked_from_id_form_builder_form_id_fk" FOREIGN KEY ("forked_from_id") REFERENCES "public"."form_builder_form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_form_publish_audit" ADD CONSTRAINT "form_builder_form_publish_audit_form_id_form_builder_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_builder_form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_form_validation" ADD CONSTRAINT "form_builder_form_validation_form_id_form_builder_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_builder_form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_form_version" ADD CONSTRAINT "form_builder_form_version_form_id_form_builder_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_builder_form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_form_version_unique" ADD CONSTRAINT "form_builder_form_version_unique_form_id_form_builder_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_builder_form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_group_instance" ADD CONSTRAINT "form_builder_group_instance_template_id_form_builder_group_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."form_builder_group_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_group_instance" ADD CONSTRAINT "form_builder_group_instance_form_id_form_builder_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_builder_form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_page_instance" ADD CONSTRAINT "form_builder_page_instance_template_id_form_builder_page_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."form_builder_page_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_page_instance" ADD CONSTRAINT "form_builder_page_instance_group_instance_id_form_builder_group_instance_id_fk" FOREIGN KEY ("group_instance_id") REFERENCES "public"."form_builder_group_instance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_submission" ADD CONSTRAINT "form_builder_submission_form_id_form_builder_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_builder_form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_submission_form_version" ADD CONSTRAINT "form_builder_submission_form_version_form_id_form_builder_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_builder_form"("id") ON DELETE no action ON UPDATE no action;