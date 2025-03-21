import { FormRepository, FormWithRelations } from "@/lib/repositories/form-repository";

const formRepository = new FormRepository();

export async function getFormById(
  id: number,
  withRelations: boolean = false,
): Promise<FormWithRelations | null> {
  try {
    if (withRelations) {
      return await formRepository.getFormWithRelations(id);
    } else {
      const form = await formRepository.getFormById(id);
      return form
        ? {
            ...form,
            groups: [],
            validations: [],
            conditions: [],
          }
        : null;
    }
  } catch (error) {
    console.error("Error fetching form:", error);
    throw new Error("Failed to fetch form");
  }
}
