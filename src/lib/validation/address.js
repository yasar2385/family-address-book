import { z } from "zod";
import { validatePincode } from "@/lib/pincode";

export const addressSchema = z.object({
  addressLine1: z.string().max(140).optional().default(""),
  addressLine2: z.string().max(140).optional().default(""),
  city: z.string().min(1, "Add an area"),
  district: z.string().min(1, "Add a district"),
  state: z.string().min(1, "Add a state"),
  pincode: z
    .string()
    .refine((value) => validatePincode(value), "Enter a 6-digit pincode"),
  contactNumber: z.string().optional().default(""),
  whatsappNumber: z.string().optional().default(""),
  latitude: z.union([z.number(), z.null()]).optional().default(null),
  longitude: z.union([z.number(), z.null()]).optional().default(null),
  googleMapUrl: z.string().optional().default("")
});

export const identitySchema = z.object({
  name: z.string().min(1, "Add a name"),
  nameTamil: z.string().optional().default(""),
  spouseName: z.string().optional().default(""),
  relationLabel: z.string().optional().default(""),
  dateOfBirth: z.string().optional().default(""),
  dateOfMarriage: z.string().optional().default(""),
  isAlive: z.boolean().default(true),
  dateOfDeath: z.string().optional().default("")
});

export function parseAddress(values) {
  const result = addressSchema.safeParse(values);
  if (!result.success) {
    const errors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }
  return { ok: true, data: result.data };
}
