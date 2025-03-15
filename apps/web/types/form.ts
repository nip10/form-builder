import {
  FormDocument,
  PageDocument,
  ElementDocument,
  FormValidationDocument,
} from "@/lib/schemas";

/**
 * Element properties interface for type safety
 */
export interface ElementProperties {
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  options?: string[];
  content?: string;
  src?: string;
  alt?: string;
  caption?: string;
  [key: string]: any;
}

/**
 * Page with populated elements instead of ObjectIds
 */
export interface PageWithElements extends Omit<PageDocument, "elements"> {
  elements: ElementDocument[];
}

/**
 * Form with populated pages instead of ObjectIds
 */
export interface FormWithPages extends Omit<FormDocument, "pages"> {
  pages: PageWithElements[];
}

/**
 * Form with populated pages and validation rules
 */
export type FormWithValidations = Omit<FormWithPages, "form_validations"> & {
  form_validations: FormValidationDocument[];
};

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    elementId?: string;
    message: string;
    rule?: any;
  }>;
}

/**
 * Helper function to safely access element properties with proper typing
 */
export const getElementProperty = <T extends keyof ElementProperties>(
  element: ElementDocument,
  property: T,
  defaultValue?: ElementProperties[T]
): ElementProperties[T] => {
  if (!element.properties) return defaultValue as ElementProperties[T];
  return ((element.properties as ElementProperties)[property] ??
    defaultValue) as ElementProperties[T];
};
