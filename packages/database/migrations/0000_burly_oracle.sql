CREATE TYPE "public"."condition_action" AS ENUM('show', 'hide', 'enforce_order');--> statement-breakpoint
CREATE TYPE "public"."element_type" AS ENUM('text_input', 'number_input', 'checkbox', 'checkbox_group', 'radio', 'radio_group', 'select', 'textarea', 'image', 'date', 'range', 'rating', 'slider', 'switch', 'toggle');--> statement-breakpoint
CREATE TYPE "public"."form_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."target_type" AS ENUM('element', 'page', 'group');--> statement-breakpoint
CREATE TYPE "public"."validation_type" AS ENUM('jsonLogic', 'regex');--> statement-breakpoint
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
	"label" text,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_builder_element_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "element_type" NOT NULL,
	"label" text,
	"default_value" text,
	"required" boolean DEFAULT true NOT NULL,
	"validations" jsonb DEFAULT '[]'::jsonb,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_builder_form_publish_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_id" integer NOT NULL,
	"version" integer NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"published_by" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "form_builder_form_response" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"element_instance_id" integer NOT NULL,
	"value" jsonb NOT NULL,
	"is_valid" boolean DEFAULT true NOT NULL,
	"validation_errors" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_builder_form_submission" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_id" integer NOT NULL,
	"form_version" integer NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"submitted_by" text,
	"status" text DEFAULT 'completed' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
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
	"forked_from_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb
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
CREATE TABLE "form_builder_group_instance" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"form_id" integer NOT NULL,
	"order_index" integer NOT NULL,
	"title" text,
	"description" text,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_builder_group_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text,
	"validations" jsonb DEFAULT '[]'::jsonb,
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
	"title" text,
	"description" text,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_builder_page_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text,
	"validations" jsonb DEFAULT '[]'::jsonb,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_builder_form_version_unique" (
	"form_id" integer NOT NULL,
	"version" integer NOT NULL,
	CONSTRAINT "form_builder_form_version_unique_form_id_version_pk" PRIMARY KEY("form_id","version")
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
ALTER TABLE "form_builder_form_publish_audit" ADD CONSTRAINT "form_builder_form_publish_audit_form_id_form_builder_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_builder_form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_form_response" ADD CONSTRAINT "form_builder_form_response_submission_id_form_builder_form_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."form_builder_form_submission"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_form_response" ADD CONSTRAINT "form_builder_form_response_element_instance_id_form_builder_element_instance_id_fk" FOREIGN KEY ("element_instance_id") REFERENCES "public"."form_builder_element_instance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_form_submission" ADD CONSTRAINT "form_builder_form_submission_form_id_form_builder_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_builder_form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_form" ADD CONSTRAINT "form_builder_form_forked_from_id_form_builder_form_id_fk" FOREIGN KEY ("forked_from_id") REFERENCES "public"."form_builder_form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_form_validation" ADD CONSTRAINT "form_builder_form_validation_form_id_form_builder_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_builder_form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_form_version" ADD CONSTRAINT "form_builder_form_version_form_id_form_builder_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_builder_form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_group_instance" ADD CONSTRAINT "form_builder_group_instance_template_id_form_builder_group_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."form_builder_group_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_group_instance" ADD CONSTRAINT "form_builder_group_instance_form_id_form_builder_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_builder_form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_page_instance" ADD CONSTRAINT "form_builder_page_instance_template_id_form_builder_page_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."form_builder_page_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_page_instance" ADD CONSTRAINT "form_builder_page_instance_group_instance_id_form_builder_group_instance_id_fk" FOREIGN KEY ("group_instance_id") REFERENCES "public"."form_builder_group_instance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_form_version_unique" ADD CONSTRAINT "form_builder_form_version_unique_form_id_form_builder_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_builder_form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_builder_submission_form_version" ADD CONSTRAINT "form_builder_submission_form_version_form_id_form_builder_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form_builder_form"("id") ON DELETE no action ON UPDATE no action;