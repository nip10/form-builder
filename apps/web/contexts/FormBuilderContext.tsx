import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  Form,
  PageInstance,
  GroupInstance,
  ElementInstance,
  ElementTemplate,
  Condition,
  FormValidation
} from "@repo/database/src/schema";

// Define a custom interface for the condition data with sourceElementId
interface ConditionWithSourceElement extends Condition {
  sourceElementId?: number;
}

// Define the FormWithRelations type
interface FormWithRelations extends Form {
  groups: (GroupInstance & {
    pages?: (PageInstance & {
      elements?: (ElementInstance & {
        template?: ElementTemplate;
      })[];
    })[];
  })[];
  pages: (PageInstance & {
    elements?: (ElementInstance & {
      template?: ElementTemplate;
    })[];
  })[];
  validations?: FormValidation[];
  conditions?: Condition[];
}

interface FormBuilderContextType {
  form: FormWithRelations | null;
  loading: boolean;
  error: string | null;

  // Form methods
  loadForm: (formId: number) => Promise<void>;
  createForm: (title: string, ownerId: string) => Promise<string | null>;
  saveForm: () => Promise<boolean>;

  // Page methods
  addPage: (title: string, description?: string) => Promise<boolean>;
  updatePage: (
    pageId: number,
    updates: Partial<PageInstance>
  ) => Promise<boolean>;
  deletePage: (pageId: number) => Promise<boolean>;

  // Element methods
  addElement: (
    pageId: number,
    element: Partial<ElementInstance>
  ) => Promise<ElementInstance | null>;
  updateElement: (
    pageId: number,
    elementId: number,
    updates: Partial<ElementInstance>
  ) => Promise<boolean>;
  deleteElement: (
    pageId: number,
    elementId: number
  ) => Promise<boolean>;

  // Group methods
  addGroup: (title: string, description?: string) => Promise<boolean>;
  updateGroup: (
    groupId: number,
    updates: Partial<GroupInstance>
  ) => Promise<boolean>;
  deleteGroup: (groupId: number) => Promise<boolean>;

  // Condition methods
  addCondition: (conditionData: {
    name: string;
    rule: any;
    action: "show" | "hide";
    targetType: "element" | "page" | "group";
    targetId: number;
    sourceElementId: number;
  }) => Promise<Condition | null>;
  updateCondition: (
    conditionId: number,
    updates: Partial<ConditionWithSourceElement>
  ) => Promise<boolean>;
  deleteCondition: (conditionId: number) => Promise<boolean>;

  // Validation methods
  addFormValidation: (
    validation: Partial<FormValidation>
  ) => Promise<FormValidation | null>;
  updateFormValidation: (
    validationId: number,
    updates: Partial<FormValidation>
  ) => Promise<boolean>;
  deleteFormValidation: (validationId: number) => Promise<boolean>;
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
  const [form, setForm] = useState<FormWithRelations | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load form from API
  const loadForm = async (formId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/forms/${formId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load form");
      }

      const data = await response.json();
      setForm(data.form as FormWithRelations);
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
      const newForm: FormWithRelations = {
        ...data.form,
        pages: [],
        form_validations: [],
      };
      setForm(newForm);
      return data.form.id;
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
      // Convert the populated form back to a regular Form for saving
      const formToSave: Form = {
        ...form,
        // Use the correct property names for the SQL schema
        id: form.id,
        title: form.title,
        description: form.description,
        status: form.status,
        currentVersion: form.currentVersion,
        forkedFromId: form.forkedFromId,
        forkDate: form.forkDate,
        createdAt: form.createdAt,
        updatedAt: new Date(), // Update the timestamp
        createdBy: form.createdBy,
        properties: form.properties
      };

      const response = await fetch(`/api/forms/${form.id}`, {
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
      await loadForm(form.id);
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
      const response = await fetch(`/api/forms/${form.id}/pages`, {
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
      };

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

  // Update the updatePage method to handle elements properly
  const updatePage = async (
    pageId: number,
    updates: Partial<PageInstance>
  ): Promise<boolean> => {
    try {
      if (!form) return false;

      // Find the page index
      const pageIndex = form.pages.findIndex((p) => p.id === pageId);
      if (pageIndex === -1) return false;

      // Create a copy of the pages array
      const updatedPages = [...form.pages];

      // Create a new page object with the updates, preserving the elements
      const currentPage = updatedPages[pageIndex];
      if (!currentPage) return false;

      const elements = currentPage.elements || [];

      // Create the updated page with proper typing
      const updatedPage = {
        ...currentPage,
        ...updates,
        elements // Preserve the elements array
      };

      updatedPages[pageIndex] = updatedPage;

      // Update the form state
      setForm({
        ...form,
        pages: updatedPages,
        updatedAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error("Error updating page:", error);
      return false;
    }
  };

  // Delete a page
  const deletePage = async (pageId: number): Promise<boolean> => {
    if (!form) {
      setError("No form to delete page from");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/forms/${form.id}/pages/${pageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete page");
      }

      // Update the form by removing the deleted page
      setForm({
        ...form,
        pages: form.pages.filter((page) => page.id !== pageId),
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
    pageId: number,
    element: Partial<ElementInstance>
  ): Promise<ElementInstance | null> => {
    if (!form) return null;

    try {
      const response = await fetch(`/api/forms/${form.id}/elements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageId,
          element: {
            ...element,
            orderIndex: element.orderIndex || 0,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add element");
      }

      const data = await response.json();

      // Update the form state with the new element
      await loadForm(form.id);

      return data.element;
    } catch (err: any) {
      console.error("Error adding element:", err);
      return null;
    }
  };

  // Update the updateElement method to handle elements properly
  const updateElement = async (
    pageId: number,
    elementId: number,
    updates: Partial<ElementInstance>
  ): Promise<boolean> => {
    try {
      if (!form) return false;

      // Find the page index
      const pageIndex = form.pages.findIndex((p) => p.id === pageId);
      if (pageIndex === -1) return false;

      const currentPage = form.pages[pageIndex];
      if (!currentPage) return false;

      const elements = currentPage.elements || [];

      const elementIndex = elements.findIndex(
        (e) => e.id === elementId
      );

      if (elementIndex === -1) return false;

      // Create a copy of the elements array
      const updatedElements = [...elements];

      // Update the element
      updatedElements[elementIndex] = {
        ...updatedElements[elementIndex],
        ...updates,
      } as ElementInstance & { template?: ElementTemplate };

      // Create the updated page with proper typing
      const updatedPage = {
        ...currentPage,
        elements: updatedElements
      };

      // Create a copy of the pages array
      const updatedPages = [...form.pages];
      updatedPages[pageIndex] = updatedPage;

      // Update the form state
      setForm({
        ...form,
        pages: updatedPages,
        updatedAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error("Error updating element:", error);
      return false;
    }
  };

  // Update the deleteElement method to handle elements properly
  const deleteElement = async (
    pageId: number,
    elementId: number
  ): Promise<boolean> => {
    try {
      if (!form) return false;

      // Find the page index
      const pageIndex = form.pages.findIndex((p) => p.id === pageId);
      if (pageIndex === -1) return false;

      const currentPage = form.pages[pageIndex];
      if (!currentPage) return false;

      const elements = currentPage.elements || [];

      // Filter out the element to delete
      const updatedElements = elements.filter(
        (e) => e.id !== elementId
      );

      // Reorder the remaining elements
      updatedElements.forEach((element, index) => {
        element.orderIndex = index + 1;
      });

      // Create the updated page with proper typing
      const updatedPage = {
        ...currentPage,
        elements: updatedElements
      };

      // Create a copy of the pages array
      const updatedPages = [...form.pages];
      updatedPages[pageIndex] = updatedPage;

      // Update the form state
      setForm({
        ...form,
        pages: updatedPages,
        updatedAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error("Error deleting element:", error);
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
      const response = await fetch(`/api/forms/${form.id}/groups`, {
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
    groupId: number,
    updates: Partial<GroupInstance>
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
        (g) => g.id === groupId
      );

      if (groupIndex === -1) {
        setError("Group not found");
        return false;
      }

      // Create a new group object with the updates
      const updatedGroup: GroupInstance = {
        id: groupId,
        titleOverride: updates.titleOverride || (form.groups[groupIndex] as any).titleOverride || null,
        descriptionOverride:
          updates.descriptionOverride !== undefined
            ? updates.descriptionOverride
            : (form.groups[groupIndex] as any).descriptionOverride,
        orderIndex:
          updates.orderIndex !== undefined
            ? updates.orderIndex
            : (form.groups[groupIndex] as any).orderIndex,
        templateId: (form.groups[groupIndex] as any).templateId,
        formId: (form.groups[groupIndex] as any).formId,
        createdAt: (form.groups[groupIndex] as any).createdAt,
        updatedAt: new Date(),
        propertiesOverride: updates.propertiesOverride || (form.groups[groupIndex] as any).propertiesOverride || null
      };

      const updatedGroups = [...form.groups];
      updatedGroups[groupIndex] = updatedGroup as any;

      setForm({
        ...form,
        groups: updatedGroups,
        updatedAt: new Date(),
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Failed to update group");
      console.error("Error updating group:", err);
      return false;
    }
  };

  // Delete a group
  const deleteGroup = async (groupId: number): Promise<boolean> => {
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
      const response = await fetch(`/api/forms/${form.id}/groups/${groupId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete group");
      }

      // Update the form by removing the deleted group
      setForm({
        ...form,
        groups: form.groups.filter((g) => g.id !== groupId),
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
    name: string;
    rule: any;
    action: "show" | "hide";
    targetType: "element" | "page" | "group";
    targetId: number;
    sourceElementId: number;
  }): Promise<Condition | null> => {
    if (!form) {
      setError("No form to add condition to");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/forms/${form.id}/conditions`, {
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

      return newCondition;
    } catch (err: any) {
      setError(err.message || "Failed to add condition");
      console.error("Error adding condition:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCondition = async (
    conditionId: number,
    updates: Partial<ConditionWithSourceElement>
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
        (c) => c.id === conditionId
      );

      if (conditionIndex === -1) {
        setError("Condition not found");
        return false;
      }

      // Create a new condition object with the updates
      const updatedCondition: ConditionWithSourceElement = {
        id: conditionId,
        name:
          updates.name || (form.conditions[conditionIndex] as any).name,
        rule:
          updates.rule || (form.conditions[conditionIndex] as any).rule,
        action:
          updates.action || (form.conditions[conditionIndex] as any).action,
        targetType:
          updates.targetType || (form.conditions[conditionIndex] as any).targetType,
        targetId:
          updates.targetId || (form.conditions[conditionIndex] as any).targetId,
        sourceElementId:
          (updates as any).sourceElementId ||
          (form.conditions[conditionIndex] as any).sourceElementId,
        formId: (form.conditions[conditionIndex] as any).formId,
        createdAt: (form.conditions[conditionIndex] as any).createdAt,
        updatedAt: new Date()
      };

      const updatedConditions = [...form.conditions];
      updatedConditions[conditionIndex] = updatedCondition as any;

      setForm({
        ...form,
        conditions: updatedConditions,
        updatedAt: new Date(),
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
    conditionId: number
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
        `/api/forms/${form.id}/conditions/${conditionId}`,
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
        conditions: form.conditions.filter((c) => c.id !== conditionId),
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
    validation: Partial<FormValidation>
  ): Promise<FormValidation | null> => {
    if (!form) {
      setError("No form loaded");
      return null;
    }

    try {
      if (
        !validation.name ||
        !validation.rule ||
        !validation.errorMessage ||
        !validation.affectedElementInstances
      ) {
        setError("Missing required validation fields");
        return null;
      }

      const newValidation: FormValidation = {
        id: Math.floor(Math.random() * 10000), // Temporary ID for client-side
        name: validation.name,
        rule: validation.rule,
        errorMessage: validation.errorMessage,
        affectedElementInstances: validation.affectedElementInstances,
        formId: form.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setForm({
        ...form,
        validations: [...(form.validations || []), newValidation],
        updatedAt: new Date(),
      });

      return newValidation;
    } catch (err: any) {
      setError(err.message || "Failed to add validation");
      console.error("Error adding validation:", err);
      return null;
    }
  };

  const updateFormValidation = async (
    validationId: number,
    updates: Partial<FormValidation>
  ): Promise<boolean> => {
    if (!form) {
      setError("No form loaded");
      return false;
    }

    setLoading(true);

    try {
      const validationIndex = form.validations?.findIndex(
        (v) => v.id === validationId
      );

      if (validationIndex === -1 || validationIndex === undefined) {
        setError("Validation not found");
        return false;
      }

      const updatedValidations = [...(form.validations || [])];

      // Update the validation
      updatedValidations[validationIndex] = {
        ...updatedValidations[validationIndex],
        ...updates,
        updatedAt: new Date() // Ensure updatedAt is always set
      } as FormValidation;

      setForm({
        ...form,
        validations: updatedValidations,
        updatedAt: new Date(),
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Failed to update validation");
      console.error("Error updating validation:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteFormValidation = async (
    validationId: number
  ): Promise<boolean> => {
    if (!form) {
      setError("No form loaded");
      return false;
    }

    setLoading(true);

    try {
      const updatedValidations = form.validations?.filter(
        (v) => v.id !== validationId
      );

      setForm({
        ...form,
        validations: updatedValidations,
        updatedAt: new Date(),
      });

      return true;
    } catch (err: any) {
      setError(err.message || "Failed to delete validation");
      console.error("Error deleting validation:", err);
      return false;
    } finally {
      setLoading(false);
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
