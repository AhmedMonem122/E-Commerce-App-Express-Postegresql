import { z } from "zod";

const productId = z.string("Invalid product ID!").cuid("Invalid product ID!");
const numberFromFormData = (message: string) => z.coerce.number(message);

export const createProductSchema = z.object({
  title: z
    .string("Please provide a product title!")
    .trim()
    .min(3, "A title should have at least 3 characters!"),
  description: z
    .string("Please provide a product description!")
    .trim()
    .min(8, "A description should have at least 8 characters!"),
  price: numberFromFormData("Please provide a product price!")
    .finite("Price must be a valid number!")
    .positive("Price must be greater than 0!"),
  ratingsAverage: numberFromFormData("Rating average must be a number!")
    .min(1, "Rating must be above 1.0")
    .max(5, "Rating must be below 5.0")
    .transform((value) => Math.round(value * 10) / 10)
    .optional(),
  ratingsQuantity: numberFromFormData("Ratings quantity must be a number!")
    .int("Ratings quantity must be an integer!")
    .nonnegative("Ratings quantity cannot be negative!")
    .optional(),
  brandId: productId.optional(),
  categoryId: productId.optional(),
});
export const updateProductSchema = createProductSchema.partial();
