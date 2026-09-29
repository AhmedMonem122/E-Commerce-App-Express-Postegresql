import { z } from "zod";
const ratingSchema = z.coerce
  .number("Rating must be a number!")
  .min(1, "The rating shouldn't be less than 1 star!")
  .max(5, "The rating shouldn't be more than 5 stars!");
export const createReviewSchema = z.object({
  review: z
    .string("A product must have a review!")
    .trim()
    .min(5, "Your review should be at least 5 characters!"),
  rating: ratingSchema.optional(),
  reactions: z
    .enum(["Like", "Dislike", "Love"], {
      message: "Reaction must be Like, Dislike, or Love!",
    })
    .optional(),
});
export const updateReviewSchema = createReviewSchema.partial();
