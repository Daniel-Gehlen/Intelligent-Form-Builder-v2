"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, GripVertical, Plus, Save, Eye } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

const fieldTypes = [
  { value: "text", label: "Text Input" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio" },
  { value: "date", label: "Date" },
  { value: "cep", label: "CEP (Auto-fill)" },
  { value: "cnpj", label: "CNPJ (Auto-fill)" },
]

export default function FormBuilder() {
  const [formTitle, setFormTitle] = useState("New Form")
  const [formDescription, setFormDescription] = useState("")
  const [fields, setFields] = useState<FormField[]>([])
  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [formStatus, setFormStatus] = useState("draft")

  const addField = (type: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: `${fieldTypes.find((f) => f.value === type)?.label} Field`,
      placeholder: "",
      required: false,
      options: type === "select" || type === "radio" ? ["Option 1", "Option 2"] : undefined,
    }
    setFields([...fields, newField])
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((field) => (field.id === id ? { ...field, ...updates } : field)))
    if (selectedField?.id === id) {
      setSelectedField({ ...selectedField, ...updates })
    }
  }

  const deleteField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id))
    if (selectedField?.id === id) {
      setSelectedField(null)
    }
  }

  const saveForm = async () => {
    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "form-builder-token",
        },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          fields,
          status: formStatus,
        }),
      })

      if (response.ok) {
        const savedForm = await response.json()
        toast.success("Form saved successfully!")
        const shareUrl = `${window.location.origin}/form/${savedForm.id}`
        navigator.clipboard.writeText(shareUrl)
        toast.success("Form URL copied to clipboard!")
      } else {
        toast.error("Failed to save form")
      }
    } catch (error) {
      toast.error("Error saving form")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Form Builder</h1>
            <p className="text-gray-600">Create and customize your form</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Form Preview</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold">{formTitle}</h2>
                    {formDescription && <p className="text-gray-600 mt-1">{formDescription}</p>}
                  </div>
                  {fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label className="text-sm font-medium">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === "text" && <Input placeholder={field.placeholder} disabled />}
                      {field.type === "email" && <Input type="email" placeholder={field.placeholder} disabled />}
                      {field.type === "textarea" && <Textarea placeholder={field.placeholder} disabled />}
                      {field.type === "select" && (
                        <Select disabled>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </Select>
                      )}
                    </div>
                  ))}
                  <Button className="w-full" disabled>
                    Submit Form (Preview)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={saveForm} size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save Form
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Field Types Sidebar */}
        <div className="w-64 bg-white border-r p-4">
          <h3 className="font-semibold mb-4">Field Types</h3>
          <div className="space-y-2">
            {fieldTypes.map((fieldType) => (
              <Button
                key={fieldType.value}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addField(fieldType.value)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {fieldType.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Form Builder Area */}
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="form-title">Form Title</Label>
                    <Input
                      id="form-title"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Enter form title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="form-description">Description</Label>
                    <Textarea
                      id="form-description"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Enter form description"
                    />
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div>
              {fields.map((field, index) => (
                <Card
                  key={field.id}
                  className={`mb-4 cursor-pointer transition-colors ${
                    selectedField?.id === field.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => setSelectedField(field)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm font-medium">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {field.type === "text" && <Input placeholder={field.placeholder} className="mt-1" disabled />}
                        {field.type === "email" && (
                          <Input type="email" placeholder={field.placeholder} className="mt-1" disabled />
                        )}
                        {field.type === "textarea" && (
                          <Textarea placeholder={field.placeholder} className="mt-1" disabled />
                        )}
                        {field.type === "select" && (
                          <Select disabled>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                          </Select>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteField(field.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {fields.length === 0 && (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">Drag and drop fields from the sidebar to start building your form</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Field Properties Sidebar */}
        {selectedField && (
          <div className="w-80 bg-white border-l p-4">
            <h3 className="font-semibold mb-4">Field Properties</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="field-label">Label</Label>
                <Input
                  id="field-label"
                  value={selectedField.label}
                  onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="field-placeholder">Placeholder</Label>
                <Input
                  id="field-placeholder"
                  value={selectedField.placeholder || ""}
                  onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="field-required"
                  checked={selectedField.required}
                  onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                />
                <Label htmlFor="field-required">Required field</Label>
              </div>
              {(selectedField.type === "select" || selectedField.type === "radio") && (
                <div>
                  <Label>Options</Label>
                  {selectedField.options?.map((option, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(selectedField.options || [])]
                          newOptions[index] = e.target.value
                          updateField(selectedField.id, { options: newOptions })
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newOptions = selectedField.options?.filter((_, i) => i !== index)
                          updateField(selectedField.id, { options: newOptions })
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const newOptions = [
                        ...(selectedField.options || []),
                        `Option ${(selectedField.options?.length || 0) + 1}`,
                      ]
                      updateField(selectedField.id, { options: newOptions })
                    }}
                  >
                    Add Option
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
