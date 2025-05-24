"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormFieldInput } from "@/components/form-field-input"
import { toast } from "sonner"

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

interface Form {
  id: string
  title: string
  description: string
  fields: FormField[]
  status: string
}

export default function PublicFormPage() {
  const params = useParams()
  const [form, setForm] = useState<Form | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string>("")

  useEffect(() => {
    fetchForm()
    fetchCSRFToken()
  }, [params.id])

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${params.id}`)
      if (response.ok) {
        const formData = await response.json()

        // Check if form is active
        if (formData.status !== "active") {
          toast.error("This form is not currently accepting submissions")
          return
        }

        setForm({
          ...formData,
          fields: JSON.parse(formData.fields),
        })
      } else {
        toast.error("Form not found")
      }
    } catch (error) {
      console.error("Error fetching form:", error)
      toast.error("Failed to load form")
    } finally {
      setLoading(false)
    }
  }

  const fetchCSRFToken = async () => {
    try {
      const response = await fetch("/api/csrf")
      if (response.ok) {
        const data = await response.json()
        setCsrfToken(data.token)
      }
    } catch (error) {
      console.error("Error fetching CSRF token:", error)
    }
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const handleAutoFill = (autoFilledData: Record<string, any>) => {
    setFormData((prev) => ({
      ...prev,
      ...autoFilledData,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!csrfToken) {
      toast.error("Security token missing. Please refresh the page.")
      return
    }

    setSubmitting(true)

    try {
      // Validate required fields on frontend
      const missingFields =
        form?.fields.filter(
          (field) => field.required && (!formData[field.id] || formData[field.id].toString().trim() === ""),
        ) || []

      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.map((f) => f.label).join(", ")}`)
        setSubmitting(false)
        return
      }

      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          formId: params.id,
          data: formData,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitted(true)
        toast.success("Form submitted successfully!")
      } else {
        if (result.details && Array.isArray(result.details)) {
          result.details.forEach((error: string) => toast.error(error))
        } else {
          toast.error(result.error || "Failed to submit form")
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Failed to submit form")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Form not found</h3>
            <p className="text-gray-600">The form you're looking for doesn't exist or is not currently active.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Thank you!</h3>
            <p className="text-gray-600">Your form has been submitted successfully.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            {form.description && <CardDescription className="text-base">{form.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {form.fields.map((field) => (
                <FormFieldInput
                  key={field.id}
                  field={field}
                  value={formData[field.id]}
                  onChange={(value) => handleInputChange(field.id, value)}
                  onAutoFill={handleAutoFill}
                  disabled={submitting}
                />
              ))}
              <Button type="submit" className="w-full" disabled={submitting || !csrfToken}>
                {submitting ? "Submitting..." : "Submit Form"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
