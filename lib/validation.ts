import { z } from "zod"

export const formFieldSchema = z.object({
  id: z.string().min(1, "Field ID is required"),
  type: z.enum(["text", "email", "phone", "textarea", "select", "checkbox", "radio", "date", "cep", "cnpj"]),
  label: z.string().min(1, "Field label is required").max(100, "Label too long"),
  placeholder: z.string().max(200, "Placeholder too long").optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
})

export const formSchema = z.object({
  title: z.string().min(1, "Form title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  fields: z.array(formFieldSchema).min(1, "At least one field is required"),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
})

export const submissionSchema = z.object({
  formId: z.string().min(1, "Form ID is required"),
  data: z.record(z.any()),
})

export const emailSchema = z.string().email("Invalid email format")

export function validateField(type: string, value: any, required = false): { isValid: boolean; error?: string } {
  try {
    if (required && (!value || value.toString().trim() === "")) {
      return { isValid: false, error: "This field is required" }
    }

    if (!required && (!value || value.toString().trim() === "")) {
      return { isValid: true }
    }

    switch (type) {
      case "email":
        emailSchema.parse(value)
        break
      case "text":
      case "textarea":
        if (value.length > 1000) {
          return { isValid: false, error: "Text too long (max 1000 characters)" }
        }
        break
      case "date":
        const date = new Date(value)
        if (isNaN(date.getTime())) {
          return { isValid: false, error: "Invalid date format" }
        }
        break
    }

    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message || "Invalid input" }
    }
    return { isValid: false, error: "Validation error" }
  }
}
