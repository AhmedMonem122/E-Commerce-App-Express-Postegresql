import { z } from "zod";
const categoryId = z
  .string("Invalid category ID!")
  .cuid("Invalid category ID!");
const idsField = z
  .union([z.array(categoryId), z.string()])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return null;
    }
    if (Array.isArray(value)) {
      return value;
    }
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
    return [value];
  })
  .pipe(z.array(categoryId))
  .optional();
export const createCategorySchema = z.object({
  title: z
    .string("Please provide a category title!")
    .trim()
    .min(3, "A title should have at least 3 characters!"),
  description: z
    .string("Please provide a category description!")
    .trim()
    .min(8, "A description should have at least 8 characters!"),
  brands: idsField,
  products: idsField,
});
export const updateCategorySchema = createCategorySchema.partial();
