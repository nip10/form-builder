import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ObjectId } from "bson";
import {
  PageDocument,
  GroupDocument,
  ConditionDocument,
  FormValidationDocument,
  ElementDocument,
  FormDocument,
} from "@repo/database/src/schema";

interface FormBuilderContextType {
  form: FormWithValidations | null;
  loading: boolean;
  error: string | null;

  // Form methods
  loadForm: (formId: string | ObjectId) => Promise<void>;
  createForm: (title: string, ownerId: string) => Promise<string | null>;
  saveForm: () => Promise<boolean>;

  // Page methods
  addPage: (title: string, description?: string) => Promise<boolean>;
  updatePage: (
    pageId: string | ObjectId,
    updates: Partial<PageDocument>
  ) => Promise<boolean>;
  deletePage: (pageId: string | ObjectId) => Promise<boolean>;

  // Element methods
  addElement: (
    pageId: string | ObjectId,
    element: Partial<ElementDocument>
  ) => Promise<ElementDocument | null>;
  updateElement: (
    pageId: string | ObjectId,
    elementId: string | ObjectId,
    updates: Partial<ElementDocument>
  ) => Promise<boolean>;
  deleteElement: (
    pageId: string | ObjectId,
    elementId: string | ObjectId
  ) => Promise<boolean>;

  // Group methods
  addGroup: (title: string, description?: string) => Promise<boolean>;
  updateGroup: (
    groupId: string | ObjectId,
    updates: Partial<GroupDocument>
  ) => Promise<boolean>;
  deleteGroup: (groupId: string | ObjectId) => Promise<boolean>;

  // Condition methods
  addCondition: (conditionData: {
    source_element_id: string | ObjectId;
    operator: string;
    value: any;
    action: string;
    target_id: string | ObjectId;
    target_type: string;
  }) => Promise<boolean>;
  updateCondition: (
    conditionId: string,
    updates: Partial<ConditionDocument>
  ) => Promise<boolean>;
  deleteCondition: (conditionId: string | ObjectId) => Promise<boolean>;

  // Validation methods
  addFormValidation: (
    validation: Partial<FormValidationDocument>
  ) => Promise<FormValidationDocument | null>;
  updateFormValidation: (
    validationId: string,
    updates: Partial<FormValidationDocument>
  ) => Promise<boolean>;
  deleteFormValidation: (validationId: string) => Promise<boolean>;
}

const FormBuilderContext = createContext<FormBuilderContextType | undefined>(
  undefined
);

export function useFormBuilder() {
  const context = useContext(FormBuilderContext);
  if (context === undefined) {
    throw new Error("useFormBuilder must be used within a FormBuilderProvider");
  }
  return context;
}

interface FormBuilderProviderProps {
  children: ReactNode;
}

export function FormBuilderProvider({ children }: FormBuilderProviderProps) {
  const [form, setForm] = useState<FormWithValidations | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load form from API
  const loadForm = async (formId: string | ObjectId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/forms/${formId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load form");
      }

      const data = await response.json();
      setForm(data.form as FormWithValidations);
    } catch (err: any) {
      setError(err.message || "Failed to load form");
      console.error("Error loading form:", err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new form
  const createForm = async (
    title: string,
    ownerId: string
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, owner_id: ownerId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create form");
      }

      const data = await response.json();
      // Initialize with empty arrays for populated fields
      const newForm: FormWithValidations = {
        ...data.form,
        pages: [],
        form_validations: [],
      };
      setForm(newForm);
      return data.form._id;
    } catch (err: any) {
      setError(err.message || "Failed to create form");
      console.error("Error creating form:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Save form changes
  const saveForm = async (): Promise<boolean> => {
    if (!form) {
      setError("No form to save");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert the populated form back to a regular FormDocument for saving
      const formToSave: FormDocument = {
        ...form,
        // Convert populated pages back to ObjectIds
        pages: form.pages.map((page) => page._id) as unknown as ObjectId[],
        // Convert populated form_validations back to ObjectIds
        form_validations: form.form_validations.map(
          (validation) => validation._id
        ) as unknown as ObjectId[],
        // Convert populated groups back to ObjectIds if they exist
        groups: form.groups
          ? (form.groups.map((group) =>
              typeof group === "object" && "_id" in group ? group._id : group
            ) as unknown as ObjectId[])
          : [],
        // Convert populated conditions back to ObjectIds if they exist
        conditions: form.conditions
          ? (form.conditions.map((condition) =>
              typeof condition === "object" && "_id" in condition
                ? condition._id
                : condition
            ) as unknown as ObjectId[])
          : [],
      };

      const response = await fetch(`/api/forms/${form._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save form");
      }

      // Reload the form to get the updated data
      await loadForm(form._id.toString());
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to save form");
      console.error("Error saving form:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add a new page to the form
  const addPage = async (
    title: string,
    description?: string
  ): Promise<boolean> => {
    if (!form) {
      setError("No form to add page to");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/forms/${form._id}/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add page");
      }

      const newPage = await response.json();

      // For UI purposes, ensure the page has an empty elements array
      const pageWithElements = {
        ...newPage,
        elements: [], // Initialize with empty elements array for UI
      } as PageWithElements; // Type assertion to ensure compatibility

      // Update the form with the new page
      setForm({
        ...form,
        pages: [...form.pages, pageWithElements],
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Failed to add page");
      console.error("Error adding page:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updatePage = async (
    pageId: string | ObjectId,
    updates: Partial<PageDocument>
  ): Promise<boolean> => {
    if (!form) {
      setError("No form loaded");
      return false;
    }

    try {
      const pageIndex = form.pages.findIndex(
        (p) => p._id.toString() === pageId.toString()
      );

      if (pageIndex === -1) {
        setError("Page not found");
        return false;
      }

      const updatedPages = [...form.pages];
      updatedPages[pageIndex] = {
        ...updatedPages[pageIndex],
        ...updates,
        // Ensure elements remains the same array of ElementDocument objects
        elements: updatedPages[pageIndex].elements,
      } as PageWithElements;

      setForm({
        ...form,
        pages: updatedPages,
        updated_at: new Date(),
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Failed to update page");
      console.error("Error updating page:", err);
      return false;
    }
  };

  // Delete a page
  const deletePage = async (pageId: string | ObjectId): Promise<boolean> => {
    if (!form) {
      setError("No form to delete page from");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/forms/${form._id}/pages/${pageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete page");
      }

      // Update the form by removing the deleted page
      setForm({
        ...form,
        pages: form.pages.filter((page) => page._id.toString() !== pageId),
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Failed to delete page");
      console.error("Error deleting page:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Element Methods
  const addElement = async (
    pageId: string | ObjectId,
    element: Partial<ElementDocument>
  ): Promise<ElementDocument | null> => {
    if (!form) return null;

    try {
      const response = await fetch(`/api/forms/${form._id}/elements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageId,
          element: {
            ...element,
            order: element.order || 0,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add element");
      }

      const data = await response.json();

      // Update the form state with the new element
      await loadForm(form._id.toString());

      return data.element;
    } catch (err: any) {
      console.error("Error adding element:", err);
      return null;
    }
  };

  const updateElement = async (
    pageId: string | ObjectId,
    elementId: string | ObjectId,
    updates: Partial<ElementDocument>
  ): Promise<boolean> => {
    if (!form) {
      setError("No form loaded");
      return false;
    }

    try {
      const pageIndex = form.pages.findIndex(
        (p) => p._id.toString() === pageId
      );

      if (pageIndex === -1) {
        setError("Page not found");
        return false;
      }

      const elementIndex = form.pages[pageIndex].elements.findIndex(
        (e) => e._id.toString() === elementId
      );

      if (elementIndex === -1) {
        setError("Element not found");
        return false;
      }

      const updatedPages = [...form.pages];
      updatedPages[pageIndex] = {
        ...updatedPages[pageIndex],
        elements: [...updatedPages[pageIndex].elements],
      };

      updatedPages[pageIndex].elements[elementIndex] = {
        ...updatedPages[pageIndex].elements[elementIndex],
        ...updates,
      };

      setForm({
        ...form,
        pages: updatedPages,
        updated_at: new Date(),
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Failed to update element");
      console.error("Error updating element:", err);
      return false;
    }
  };

  const deleteElement = async (
    pageId: string | ObjectId,
    elementId: string | ObjectId
  ): Promise<boolean> => {
    if (!form) {
      setError("No form loaded");
      return false;
    }

    try {
      const pageIndex = form.pages.findIndex(
        (p) => p._id.toString() === pageId
      );

      if (pageIndex === -1) {
        setError("Page not found");
        return false;
      }

      const updatedPages = [...form.pages];
      updatedPages[pageIndex] = {
        ...updatedPages[pageIndex],
        elements: updatedPages[pageIndex].elements.filter(
          (e) => e._id.toString() !== elementId
        ),
      };

      // Reorder remaining elements
      updatedPages[pageIndex].elements.forEach((element, index) => {
        element.order = index + 1;
      });

      setForm({
        ...form,
        pages: updatedPages,
        updated_at: new Date(),
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Failed to delete element");
      console.error("Error deleting element:", err);
      return false;
    }
  };

  // Add a group to the form
  const addGroup = async (
    title: string,
    description?: string
  ): Promise<boolean> => {
    if (!form) {
      setError("No form to add group to");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/forms/${form._id}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add group");
      }

      const newGroup = await response.json();

      // Update the form with the new group
      setForm({
        ...form,
        groups: [...(form.groups || []), newGroup],
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Failed to add group");
      console.error("Error adding group:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateGroup = async (
    groupId: string | ObjectId,
    updates: Partial<GroupDocument>
  ): Promise<boolean> => {
    if (!form) {
      setError("No form loaded");
      return false;
    }

    try {
      if (!form.groups) {
        setError("No groups found");
        return false;
      }

      const groupIndex = form.groups.findIndex(
        (g) =>
          typeof g === "object" &&
          "_id" in g &&
          (g as { _id: ObjectId })._id.toString() === groupId.toString()
      );

      if (groupIndex === -1) {
        setError("Group not found");
        return false;
      }

      // Create a new group object with the updates
      const updatedGroup: GroupDocument = {
        _id:
          form.groups[groupIndex] instanceof ObjectId
            ? (form.groups[groupIndex] as ObjectId)
            : (form.groups[groupIndex] as GroupDocument)._id,
        title: updates.title || (form.groups[groupIndex] as any).title || "",
        description:
          updates.description !== undefined
            ? updates.description
            : (form.groups[groupIndex] as any).description,
        order:
          updates.order !== undefined
            ? updates.order
            : (form.groups[groupIndex] as any).order,
      };

      const updatedGroups = [...form.groups];
      updatedGroups[groupIndex] = updatedGroup as any;

      setForm({
        ...form,
        groups: updatedGroups,
        updated_at: new Date(),
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Failed to update group");
      console.error("Error updating group:", err);
      return false;
    }
  };

  // Delete a group
  const deleteGroup = async (groupId: string | ObjectId): Promise<boolean> => {
    if (!form) {
      setError("No form to delete group from");
      return false;
    }

    if (!form.groups) {
      setError("No groups to delete from");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/forms/${form._id}/groups/${groupId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete group");
      }

      // Update the form by removing the deleted group
      setForm({
        ...form,
        groups: form.groups.filter((g) => {
          if (typeof g === "object" && "_id" in g) {
            return (
              (g as { _id: ObjectId })._id.toString() !== groupId.toString()
            );
          }
          return g.toString() !== groupId.toString();
        }),
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Failed to delete group");
      console.error("Error deleting group:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add a condition to the form
  const addCondition = async (conditionData: {
    source_element_id: string | ObjectId;
    operator: string;
    value: any;
    action: string;
    target_id: string | ObjectId;
    target_type: string;
  }): Promise<boolean> => {
    if (!form) {
      setError("No form to add condition to");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/forms/${form._id}/conditions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(conditionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add condition");
      }

      const newCondition = await response.json();

      // Update the form with the new condition
      setForm({
        ...form,
        conditions: [...(form.conditions || []), newCondition],
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Failed to add condition");
      console.error("Error adding condition:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateCondition = async (
    conditionId: string,
    updates: Partial<ConditionDocument>
  ): Promise<boolean> => {
    if (!form) {
      setError("No form loaded");
      return false;
    }

    try {
      if (!form.conditions) {
        setError("No conditions found");
        return false;
      }

      const conditionIndex = form.conditions.findIndex(
        (c) =>
          typeof c === "object" &&
          "_id" in c &&
          (c as { _id: ObjectId })._id.toString() === conditionId.toString()
      );

      if (conditionIndex === -1) {
        setError("Condition not found");
        return false;
      }

      // Create a new condition object with the updates
      const updatedCondition: ConditionDocument = {
        _id:
          form.conditions[conditionIndex] instanceof ObjectId
            ? (form.conditions[conditionIndex] as ObjectId)
            : (form.conditions[conditionIndex] as ConditionDocument)._id,
        source_element_id:
          updates.source_element_id ||
          (form.conditions[conditionIndex] as any).source_element_id,
        operator:
          updates.operator || (form.conditions[conditionIndex] as any).operator,
        value:
          updates.value !== undefined
            ? updates.value
            : (form.conditions[conditionIndex] as any).value,
        action:
          updates.action || (form.conditions[conditionIndex] as any).action,
        target_id:
          updates.target_id ||
          (form.conditions[conditionIndex] as any).target_id,
        target_type:
          updates.target_type ||
          (form.conditions[conditionIndex] as any).target_type,
      };

      const updatedConditions = [...form.conditions];
      updatedConditions[conditionIndex] = updatedCondition as any;

      setForm({
        ...form,
        conditions: updatedConditions,
        updated_at: new Date(),
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Failed to update condition");
      console.error("Error updating condition:", err);
      return false;
    }
  };

  // Delete a condition
  const deleteCondition = async (
    conditionId: string | ObjectId
  ): Promise<boolean> => {
    if (!form) {
      setError("No form to delete condition from");
      return false;
    }

    if (!form.conditions) {
      setError("No conditions to delete from");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/forms/${form._id}/conditions/${conditionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete condition");
      }

      // Update the form by removing the deleted condition
      setForm({
        ...form,
        conditions: form.conditions.filter((c) => {
          if (typeof c === "object" && "_id" in c) {
            return (
              (c as { _id: ObjectId })._id.toString() !== conditionId.toString()
            );
          }
          return c.toString() !== conditionId.toString();
        }),
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Failed to delete condition");
      console.error("Error deleting condition:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Validation Methods
  const addFormValidation = async (
    validation: Partial<FormValidationDocument>
  ): Promise<FormValidationDocument | null> => {
    if (!form) {
      setError("No form loaded");
      return null;
    }

    try {
      if (
        !validation.name ||
        !validation.rule ||
        !validation.error_message ||
        !validation.affected_elements
      ) {
        setError("Missing required validation fields");
        return null;
      }

      const newValidation: FormValidationDocument = {
        _id: new ObjectId(),
        name: validation.name,
        rule: validation.rule,
        error_message: validation.error_message,
        affected_elements: validation.affected_elements.map(
          (id) => new ObjectId(id.toString())
        ),
      };

      setForm({
        ...form,
        form_validations: [...form.form_validations, newValidation],
        updated_at: new Date(),
      });

      return newValidation;
    } catch (err: any) {
      setError(err.message || "Failed to add validation");
      console.error("Error adding validation:", err);
      return null;
    }
  };

  const updateFormValidation = async (
    validationId: string,
    updates: Partial<FormValidationDocument>
  ): Promise<boolean> => {
    if (!form) {
      setError("No form loaded");
      return false;
    }

    try {
      const validationIndex = form.form_validations.findIndex(
        (v) => v._id.toString() === validationId
      );

      if (validationIndex === -1) {
        setError("Validation not found");
        return false;
      }

      const updatedValidations = [...form.form_validations];

      // Handle affected_elements separately to ensure they are ObjectIds
      if (updates.affected_elements) {
        updates = {
          ...updates,
          affected_elements: updates.affected_elements.map(
            (id: string | ObjectId) =>
              id instanceof ObjectId ? id : new ObjectId(id.toString())
          ),
        };
      }

      updatedValidations[validationIndex] = {
        ...updatedValidations[validationIndex],
        ...updates,
      };

      setForm({
        ...form,
        form_validations: updatedValidations,
        updated_at: new Date(),
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Failed to update validation");
      console.error("Error updating validation:", err);
      return false;
    }
  };

  const deleteFormValidation = async (
    validationId: string
  ): Promise<boolean> => {
    if (!form) {
      setError("No form loaded");
      return false;
    }

    try {
      const updatedValidations = form.form_validations.filter(
        (v) => v._id.toString() !== validationId
      );

      setForm({
        ...form,
        form_validations: updatedValidations,
        updated_at: new Date(),
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Failed to delete validation");
      console.error("Error deleting validation:", err);
      return false;
    }
  };

  // Save form automatically when it changes (debounced)
  useEffect(() => {
    if (form) {
      const timer = setTimeout(() => {
        saveForm();
      }, 2000); // 2 second debounce

      return () => clearTimeout(timer);
    }
  }, [form]);

  const value: FormBuilderContextType = {
    form,
    loading,
    error,
    loadForm,
    createForm,
    saveForm,
    addPage,
    updatePage,
    deletePage,
    addElement,
    updateElement,
    deleteElement,
    addGroup,
    updateGroup,
    deleteGroup,
    addCondition,
    updateCondition,
    deleteCondition,
    addFormValidation,
    updateFormValidation,
    deleteFormValidation,
  };

  return (
    <FormBuilderContext.Provider value={value}>
      {children}
    </FormBuilderContext.Provider>
  );
}
