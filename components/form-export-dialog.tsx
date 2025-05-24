"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileCode, FileJson, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface FormExportDialogProps {
  formId: string
  formTitle: string
}

export function FormExportDialog({ formId, formTitle }: FormExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<"html" | "json">("html")

  // HTML Export Options
  const [htmlOptions, setHtmlOptions] = useState({
    includeValidation: true,
    includeAutoFill: true,
    includeCSS: true,
    includeBootstrap: false,
    submitUrl: "",
    theme: "default" as "default" | "dark",
    filename: "",
  })

  // JSON Export Options
  const [jsonOptions, setJsonOptions] = useState({
    includeMetadata: true,
    includeValidation: true,
    minify: false,
    version: "1.0",
    filename: "",
  })

  const handleExport = async () => {
    setExporting(true)

    try {
      const params = new URLSearchParams({
        format: exportFormat,
      })

      if (exportFormat === "html") {
        // Add HTML-specific parameters
        Object.entries(htmlOptions).forEach(([key, value]) => {
          if (value !== "" && value !== false) {
            params.append(key, value.toString())
          }
        })
      } else {
        // Add JSON-specific parameters
        Object.entries(jsonOptions).forEach(([key, value]) => {
          if (value !== "" && value !== false) {
            params.append(key, value.toString())
          }
        })
      }

      const response = await fetch(`/api/forms/${formId}/export?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Export failed")
      }

      // Get filename from response headers or use default
      const contentDisposition = response.headers.get("content-disposition")
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch?.[1] || `${formTitle}.${exportFormat}`

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Form exported successfully as ${exportFormat.toUpperCase()}!`)
      setOpen(false)
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export form")
    } finally {
      setExporting(false)
    }
  }

  const copyExportUrl = () => {
    const params = new URLSearchParams({
      format: exportFormat,
    })

    if (exportFormat === "html") {
      Object.entries(htmlOptions).forEach(([key, value]) => {
        if (value !== "" && value !== false) {
          params.append(key, value.toString())
        }
      })
    } else {
      Object.entries(jsonOptions).forEach(([key, value]) => {
        if (value !== "" && value !== false) {
          params.append(key, value.toString())
        }
      })
    }

    const url = `${window.location.origin}/api/forms/${formId}/export?${params.toString()}`
    navigator.clipboard.writeText(url)
    toast.success("Export URL copied to clipboard!")
  }

  const previewExport = () => {
    const params = new URLSearchParams({
      format: exportFormat,
    })

    if (exportFormat === "html") {
      Object.entries(htmlOptions).forEach(([key, value]) => {
        if (value !== "" && value !== false) {
          params.append(key, value.toString())
        }
      })
    }

    const url = `${window.location.origin}/api/forms/${formId}/export?${params.toString()}`
    window.open(url, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Form</DialogTitle>
          <DialogDescription>Export your form as HTML or JSON with customizable options</DialogDescription>
        </DialogHeader>

        <Tabs value={exportFormat} onValueChange={(value) => setExportFormat(value as "html" | "json")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="html" className="flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              HTML Export
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-2">
              <FileJson className="w-4 h-4" />
              JSON Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="html" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">HTML Export Options</CardTitle>
                <CardDescription>Generate a complete HTML file with embedded CSS and JavaScript</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="html-filename">Custom Filename</Label>
                    <Input
                      id="html-filename"
                      placeholder="my-form.html"
                      value={htmlOptions.filename}
                      onChange={(e) => setHtmlOptions({ ...htmlOptions, filename: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="submit-url">Submit URL (Optional)</Label>
                    <Input
                      id="submit-url"
                      placeholder="https://your-api.com/submit"
                      value={htmlOptions.submitUrl}
                      onChange={(e) => setHtmlOptions({ ...htmlOptions, submitUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={htmlOptions.theme}
                    onValueChange={(value: "default" | "dark") => setHtmlOptions({ ...htmlOptions, theme: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default (Light)</SelectItem>
                      <SelectItem value="dark">Dark Theme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-validation"
                      checked={htmlOptions.includeValidation}
                      onCheckedChange={(checked) => setHtmlOptions({ ...htmlOptions, includeValidation: !!checked })}
                    />
                    <Label htmlFor="include-validation">Include Validation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-autofill"
                      checked={htmlOptions.includeAutoFill}
                      onCheckedChange={(checked) => setHtmlOptions({ ...htmlOptions, includeAutoFill: !!checked })}
                    />
                    <Label htmlFor="include-autofill">Include Auto-fill</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-css"
                      checked={htmlOptions.includeCSS}
                      onCheckedChange={(checked) => setHtmlOptions({ ...htmlOptions, includeCSS: !!checked })}
                    />
                    <Label htmlFor="include-css">Include CSS Styles</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-bootstrap"
                      checked={htmlOptions.includeBootstrap}
                      onCheckedChange={(checked) => setHtmlOptions({ ...htmlOptions, includeBootstrap: !!checked })}
                    />
                    <Label htmlFor="include-bootstrap">Include Bootstrap</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="json" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">JSON Export Options</CardTitle>
                <CardDescription>Export form structure and configuration as JSON</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="json-filename">Custom Filename</Label>
                    <Input
                      id="json-filename"
                      placeholder="my-form.json"
                      value={jsonOptions.filename}
                      onChange={(e) => setJsonOptions({ ...jsonOptions, filename: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">Export Version</Label>
                    <Input
                      id="version"
                      placeholder="1.0"
                      value={jsonOptions.version}
                      onChange={(e) => setJsonOptions({ ...jsonOptions, version: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-metadata"
                      checked={jsonOptions.includeMetadata}
                      onCheckedChange={(checked) => setJsonOptions({ ...jsonOptions, includeMetadata: !!checked })}
                    />
                    <Label htmlFor="include-metadata">Include Metadata</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-validation-json"
                      checked={jsonOptions.includeValidation}
                      onCheckedChange={(checked) => setJsonOptions({ ...jsonOptions, includeValidation: !!checked })}
                    />
                    <Label htmlFor="include-validation-json">Include Validation Rules</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="minify"
                      checked={jsonOptions.minify}
                      onCheckedChange={(checked) => setJsonOptions({ ...jsonOptions, minify: !!checked })}
                    />
                    <Label htmlFor="minify">Minify JSON</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyExportUrl}>
              <Copy className="w-4 h-4 mr-2" />
              Copy URL
            </Button>
            {exportFormat === "html" && (
              <Button variant="outline" onClick={previewExport}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
