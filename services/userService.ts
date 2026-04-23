import { PrismaClient } from "@prisma/client/extension";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();
// CREATE USER (replaces pre-save hashing)
export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}) => {
  if (data.password !== data.passwordConfirm) {
    throw new Error("Passwords do not match");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
  });
};

export const correctPassword = async (
  candidatePassword: string,
  userPassword: string,
) => {
  return await bcrypt.compare(candidatePassword, userPassword);
};

export const changedPasswordAfter = (
  passwordChangedAt: Date | null,
  JWTTimestamp: number,
) => {
  if (!passwordChangedAt) return false;

  const changedTimestamp = Math.floor(passwordChangedAt.getTime() / 1000);
  return JWTTimestamp < changedTimestamp;
};

export const createPasswordResetToken = async (userId: string) => {
  const resetToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  return resetToken;
};

export const updatePassword = async (userId: string, newPassword: string) => {
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  return prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      passwordChangedAt: new Date(Date.now() - 1000),
    },
  });
};
