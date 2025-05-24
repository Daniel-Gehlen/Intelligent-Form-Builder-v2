"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { validateField } from "@/lib/validation"
import { toast } from "sonner"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

interface FormFieldInputProps {
  field: FormField
  value: any
  onChange: (value: any) => void
  onAutoFill?: (data: Record<string, any>) => void
  disabled?: boolean
}

export function FormFieldInput({ field, value, onChange, onAutoFill, disabled = false }: FormFieldInputProps) {
  const [validationState, setValidationState] = useState<{
    isValid: boolean
    error?: string
    isValidating?: boolean
  }>({ isValid: true })

  const [autoFillState, setAutoFillState] = useState<{
    isLoading: boolean
    hasAutoFilled: boolean
  }>({ isLoading: false, hasAutoFilled: false })

  // Debounced validation
  const validateWithDebounce = useCallback(
    debounce((fieldType: string, fieldValue: any, isRequired: boolean) => {
      setValidationState((prev) => ({ ...prev, isValidating: true }))

      const result = validateField(fieldType, fieldValue, isRequired)

      setValidationState({
        isValid: result.isValid,
        error: result.error,
        isValidating: false,
      })
    }, 300),
    [],
  )

  // Auto-fill functionality (simplified)
  const handleAutoFill = useCallback(
    debounce(async (fieldType: string, fieldValue: string) => {
      if (!onAutoFill || !fieldValue) return

      setAutoFillState((prev) => ({ ...prev, isLoading: true }))

      try {
        if (fieldType === "cep" && fieldValue.replace(/\D/g, "").length === 8) {
          // Simular auto-fill CEP
          const mockData = {
            address: "Rua Exemplo",
            neighborhood: "Centro",
            city: "São Paulo",
            state: "SP",
          }
          onAutoFill(mockData)
          setAutoFillState({ isLoading: false, hasAutoFilled: true })
          toast.success("CEP auto-preenchido com sucesso!")
        } else if (fieldType === "cnpj" && fieldValue.replace(/\D/g, "").length === 14) {
          // Simular auto-fill CNPJ
          const mockData = {
            companyName: "Empresa Exemplo LTDA",
            fantasyName: "Empresa Exemplo",
            companyAddress: "Av. Exemplo, 123",
            companyCity: "São Paulo",
            companyState: "SP",
          }
          onAutoFill(mockData)
          setAutoFillState({ isLoading: false, hasAutoFilled: true })
          toast.success("CNPJ auto-preenchido com sucesso!")
        }
      } catch (error) {
        setAutoFillState({ isLoading: false, hasAutoFilled: false })
        toast.error(`Falha no auto-preenchimento`)
      }
    }, 500),
    [onAutoFill],
  )

  const handleChange = (newValue: any) => {
    onChange(newValue)

    if (autoFillState.hasAutoFilled) {
      setAutoFillState((prev) => ({ ...prev, hasAutoFilled: false }))
    }

    validateWithDebounce(field.type, newValue, field.required)

    if ((field.type === "cep" || field.type === "cnpj") && newValue) {
      handleAutoFill(field.type, newValue)
    }
  }

  useEffect(() => {
    if (value !== undefined && value !== "") {
      validateWithDebounce(field.type, value, field.required)
    }
  }, [field.type, field.required, validateWithDebounce])

  const formatValue = (val: any) => {
    if (field.type === "cep" && val) {
      const clean = val.replace(/\D/g, "")
      return clean.replace(/(\d{5})(\d{3})/, "$1-$2")
    }
    if (field.type === "cnpj" && val) {
      const clean = val.replace(/\D/g, "")
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    }
    return val || ""
  }

  const getValidationIcon = () => {
    if (validationState.isValidating || autoFillState.isLoading) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
    }
    if (!validationState.isValid && validationState.error) {
      return <AlertCircle className="w-4 h-4 text-red-500" />
    }
    if (validationState.isValid && value && value.toString().trim() !== "") {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    return null
  }

  const renderField = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
      case "cep":
      case "cnpj":
        return (
          <div className="relative">
            <Input
              type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
              value={formatValue(value)}
              onChange={(e) => {
                let val = e.target.value
                if (field.type === "cep" || field.type === "cnpj") {
                  val = val.replace(/\D/g, "")
                }
                handleChange(val)
              }}
              placeholder={field.placeholder}
              disabled={disabled}
              className={`pr-10 ${
                !validationState.isValid && validationState.error
                  ? "border-red-500 focus:border-red-500"
                  : validationState.isValid && value && value.toString().trim() !== ""
                    ? "border-green-500 focus:border-green-500"
                    : ""
              }`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">{getValidationIcon()}</div>
          </div>
        )

      case "textarea":
        return (
          <div className="relative">
            <Textarea
              value={value || ""}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder}
              disabled={disabled}
              className={`${
                !validationState.isValid && validationState.error
                  ? "border-red-500 focus:border-red-500"
                  : validationState.isValid && value && value.toString().trim() !== ""
                    ? "border-green-500 focus:border-green-500"
                    : ""
              }`}
            />
            <div className="absolute right-3 top-3">{getValidationIcon()}</div>
          </div>
        )

      case "select":
        return (
          <Select value={value || ""} onValueChange={handleChange} disabled={disabled}>
            <SelectTrigger
              className={`${
                !validationState.isValid && validationState.error
                  ? "border-red-500 focus:border-red-500"
                  : validationState.isValid && value
                    ? "border-green-500 focus:border-green-500"
                    : ""
              }`}
            >
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "radio":
        return (
          <RadioGroup value={value || ""} onValueChange={handleChange} disabled={disabled}>
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox id={field.id} checked={!!value} onCheckedChange={handleChange} disabled={disabled} />
            <Label htmlFor={field.id}>{field.label}</Label>
          </div>
        )

      case "date":
        return (
          <div className="relative">
            <Input
              type="date"
              value={value || ""}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              className={`${
                !validationState.isValid && validationState.error
                  ? "border-red-500 focus:border-red-500"
                  : validationState.isValid && value
                    ? "border-green-500 focus:border-green-500"
                    : ""
              }`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">{getValidationIcon()}</div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-2">
      {field.type !== "checkbox" && (
        <Label htmlFor={field.id}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
          {autoFillState.isLoading && <span className="text-blue-500 ml-2 text-sm">(Auto-filling...)</span>}
          {autoFillState.hasAutoFilled && <span className="text-green-500 ml-2 text-sm">(Auto-filled)</span>}
        </Label>
      )}
      {renderField()}
      {!validationState.isValid && validationState.error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {validationState.error}
        </p>
      )}
    </div>
  )
}

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}
