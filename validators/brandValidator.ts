import { z } from "zod";

export const createBrandSchema = z.object({
  title: z
    .string("Please provide a brand title!")
    .trim()
    .min(3, "A title should have at least 3 characters!"),

  description: z
    .string("Please provide a brand description!")
    .trim()
    .min(10, "A description should have at least 10 characters!"),

  categoryId: z
    .string("Please provide a brand category!")
    .cuid("Invalid category ID!"),

  products: z.array(z.string().cuid("Invalid product ID!")).optional(),
});

export const updateBrandSchema = createBrandSchema.partial();
