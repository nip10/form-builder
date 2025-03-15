import papr from "./db";

import {
  ConditionSchema,
  ElementSchema,
  FormSchema,
  FormValidationSchema,
  GroupSchema,
  PageSchema,
  SubmissionSchema,
} from "./schemas";
export const ElementModel = papr.model("elements", ElementSchema);
export const ConditionModel = papr.model("conditions", ConditionSchema);
export const PageModel = papr.model("pages", PageSchema);
export const GroupModel = papr.model("groups", GroupSchema);
export const FormValidationModel = papr.model(
  "form_validations",
  FormValidationSchema
);
export const FormModel = papr.model("forms", FormSchema);
export const SubmissionModel = papr.model("submissions", SubmissionSchema);
