import { prisma } from "../prisma/client.js";

export const calcAverageRatings = async (productId: string) => {
  const stats = await prisma.review.aggregate({
    where: { productId },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  if (stats._count.rating > 0) {
    await prisma.product.update({
      where: { id: productId },
      data: {
        ratingsQuantity: stats._count.rating,
        ratingsAverage: stats._avg.rating ?? 4.5,
      },
    });
  } else {
    await prisma.product.update({
      where: { id: productId },
      data: {
        ratingsQuantity: 0,
        ratingsAverage: 4.5,
      },
    });
  }
};
