import { z } from "zod";

// ==============================
// COMMON FIELDS
// ==============================

const nameSchema = z
  .string("Please provide your name!")
  .trim()
  .min(1, "Name cannot be empty!");

const emailSchema = z
  .string("Please provide your email!")
  .trim()
  .toLowerCase()
  .email("This field must be a valid email address!");

const passwordSchema = z
  .string("Please provide your password!")
  .min(8, "Password should be 8 characters or more!");

// ==============================
// SIGN UP
// ==============================

export const signupSchema = z
  .object({
    name: nameSchema,

    email: emailSchema,

    password: passwordSchema,

    passwordConfirm: z.string("Please confirm your password!"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Password and Password Confirm are not the same!",
    path: ["passwordConfirm"],
  });

// ==============================
// LOGIN
// ==============================

export const loginSchema = z.object({
  email: emailSchema,

  password: z.string("Please provide your password!"),
});

// ==============================
// FORGOT PASSWORD
// ==============================

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// ==============================
// RESET PASSWORD
// ==============================

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,

    passwordConfirm: z.string("Please confirm your password!"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Password and Password Confirm are not the same!",
    path: ["passwordConfirm"],
  });

// ==============================
// UPDATE MY PASSWORD
// ==============================

export const updatePasswordSchema = z
  .object({
    passwordCurrent: z.string("Please provide your current password!"),

    password: passwordSchema,

    passwordConfirm: z.string("Please confirm your password!"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Password and Password Confirm are not the same!",
    path: ["passwordConfirm"],
  });

// ==============================
// UPDATE ME
// ==============================

export const updateMeSchema = z
  .object({
    name: nameSchema.optional(),

    email: emailSchema.optional(),
  })
  .strict();

// ==============================
// ADMIN CREATE USER
// ==============================

export const createUserSchema = z.object({
  name: nameSchema,

  email: emailSchema,

  password: passwordSchema,

  role: z
    .enum(["USER", "ADMIN"], {
      message: "Role must be USER or ADMIN!",
    })
    .optional(),

  active: z.boolean().optional(),

  photo: z.string().optional(),
});

// ==============================
// ADMIN UPDATE USER
// ==============================

export const updateUserSchema = z
  .object({
    name: nameSchema.optional(),

    email: emailSchema.optional(),

    password: passwordSchema.optional(),

    role: z
      .enum(["USER", "ADMIN"], {
        message: "Role must be USER or ADMIN!",
      })
      .optional(),

    active: z.boolean().optional(),

    photo: z.string().optional(),
  })
  .strict();
