import { db } from '@repo/database';
import {
  FormTable,
  Form,
  NewForm,
  GroupInstanceTable,
  GroupInstance,
  NewGroupInstance,
  PageInstanceTable,
  PageInstance,
  NewPageInstance,
  ElementInstanceTable,
  ElementInstance,
  NewElementInstance,
  FormValidationTable,
  ConditionTable
} from '@repo/database/src/schema';
import { eq, desc, inArray } from 'drizzle-orm';

// Define a type for a form with all its relations
export type FormWithRelations = Form & {
  pages: (PageInstance & {
    elements: ElementInstance[];
  })[];
  groups: (GroupInstance & {
    pages: PageInstance[];
  })[];
  formValidations: any[];
  conditions: any[];
};

export class FormRepository {
  // Form operations
  async getAllForms(): Promise<Form[]> {
    return db.query.FormTable.findMany({
      orderBy: [desc(FormTable.updatedAt)]
    });
  }

  async getFormById(id: number): Promise<Form | undefined> {
    return db.query.FormTable.findFirst({
      where: eq(FormTable.id, id)
    });
  }

  async getFormWithRelations(id: number): Promise<FormWithRelations | null> {
    // Get the form
    const form = await db.query.FormTable.findFirst({
      where: eq(FormTable.id, id)
    });

    if (!form) return null;

    // Get the groups
    const groups = await db.query.GroupInstanceTable.findMany({
      where: eq(GroupInstanceTable.formId, id),
      orderBy: [GroupInstanceTable.orderIndex]
    });

    // Get all pages for this form's groups
    const groupIds = groups.map(g => g.id);
    const pages = await db.query.PageInstanceTable.findMany({
      where: groupIds.length > 0 ?
        inArray(PageInstanceTable.groupInstanceId, groupIds) :
        undefined,
      orderBy: [PageInstanceTable.orderIndex]
    });

    // Get all elements for these pages
    const pageIds = pages.map(p => p.id);
    const elements = await db.query.ElementInstanceTable.findMany({
      where: pageIds.length > 0 ?
        inArray(ElementInstanceTable.pageInstanceId, pageIds) :
        undefined,
      orderBy: [ElementInstanceTable.orderIndex]
    });

    // Get form validations
    const validations = await db.query.FormValidationTable.findMany({
      where: eq(FormValidationTable.formId, id)
    });

    // Get conditions
    const conditions = await db.query.ConditionTable.findMany({
      where: eq(ConditionTable.formId, id)
    });

    // Map pages to their groups and add elements
    const pagesWithElements = pages.map(page => {
      const pageElements = elements.filter(e => e.pageInstanceId === page.id);
      return {
        ...page,
        elements: pageElements
      };
    });

    // Map groups with their pages
    const groupsWithPages = groups.map(group => {
      const groupPages = pagesWithElements.filter(p => p.groupInstanceId === group.id);
      return {
        ...group,
        pages: groupPages
      };
    });

    // Return the form with all its relations
    return {
      ...form,
      pages: pagesWithElements,
      groups: groupsWithPages,
      formValidations: validations,
      conditions: conditions
    };
  }

  async createForm(data: Partial<NewForm>): Promise<Form> {
    const [form] = await db.insert(FormTable)
      .values({
        title: data.title || 'Untitled Form',
        description: data.description,
        status: 'draft',
        currentVersion: 1,
        forkedFromId: 0, // Default value for required field
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: data.createdBy
      })
      .returning();

    if (!form) {
      throw new Error("Failed to create form");
    }

    return form;
  }

  async updateForm(id: number, data: Partial<NewForm>): Promise<Form | undefined> {
    const [updated] = await db.update(FormTable)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(FormTable.id, id))
      .returning();

    return updated;
  }

  async deleteForm(id: number): Promise<boolean> {
    const result = await db.delete(FormTable)
      .where(eq(FormTable.id, id))
      .returning({ id: FormTable.id });

    return result.length > 0;
  }

  // Group operations
  async createGroup(formId: number, data: Partial<NewGroupInstance>): Promise<GroupInstance> {
    // Get the count of existing groups to determine order
    const existingGroups = await db.query.GroupInstanceTable.findMany({
      where: eq(GroupInstanceTable.formId, formId)
    });

    const [group] = await db.insert(GroupInstanceTable)
      .values({
        templateId: data.templateId || 1,
        formId: formId,
        orderIndex: data.orderIndex || existingGroups.length + 1,
        titleOverride: data.titleOverride,
        descriptionOverride: data.descriptionOverride,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    if (!group) {
      throw new Error("Failed to create group");
    }

    return group;
  }

  // Page operations
  async createPage(groupId: number, data: Partial<NewPageInstance>): Promise<PageInstance> {
    // Get the count of existing pages to determine order
    const existingPages = await db.query.PageInstanceTable.findMany({
      where: eq(PageInstanceTable.groupInstanceId, groupId)
    });

    const [page] = await db.insert(PageInstanceTable)
      .values({
        templateId: data.templateId || 1,
        groupInstanceId: groupId,
        orderIndex: data.orderIndex || existingPages.length + 1,
        titleOverride: data.titleOverride,
        descriptionOverride: data.descriptionOverride,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    if (!page) {
      throw new Error("Failed to create page");
    }

    return page;
  }

  // Element operations
  async createElement(pageId: number, data: Partial<NewElementInstance>): Promise<ElementInstance> {
    // Get the count of existing elements to determine order
    const existingElements = await db.query.ElementInstanceTable.findMany({
      where: eq(ElementInstanceTable.pageInstanceId, pageId)
    });

    const [element] = await db.insert(ElementInstanceTable)
      .values({
        templateId: data.templateId || 1,
        pageInstanceId: pageId,
        orderIndex: data.orderIndex || existingElements.length + 1,
        required: data.required || false,
        labelOverride: data.labelOverride,
        propertiesOverride: data.propertiesOverride || {},
        validations: data.validations || [],
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    if (!element) {
      throw new Error("Failed to create element");
    }

    return element;
  }
}