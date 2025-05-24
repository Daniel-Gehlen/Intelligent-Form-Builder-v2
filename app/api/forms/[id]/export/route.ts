import { type NextRequest, NextResponse } from "next/server"
import { initDatabase } from "@/lib/database"
import { FormExporter, type HTMLExportOptions, type JSONExportOptions } from "@/lib/form-exporter"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "json"
    const filename = searchParams.get("filename")

    const db = await initDatabase()
    const form = await db.get("SELECT * FROM forms WHERE id = ?", [params.id])

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 })
    }

    const formData = {
      ...form,
      fields: JSON.parse(form.fields),
    }

    const exporter = FormExporter.getInstance()

    if (format === "html") {
      // Parse HTML export options
      const options: HTMLExportOptions = {
        includeValidation: searchParams.get("includeValidation") !== "false",
        includeAutoFill: searchParams.get("includeAutoFill") !== "false",
        includeCSS: searchParams.get("includeCSS") !== "false",
        includeBootstrap: searchParams.get("includeBootstrap") === "true",
        submitUrl: searchParams.get("submitUrl") || "",
        theme: (searchParams.get("theme") as "default" | "dark") || "default",
      }

      const htmlContent = exporter.exportAsHTML(formData, options)
      const exportFilename = filename || `${form.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.html`

      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${exportFilename}"`,
          "Cache-Control": "no-cache",
        },
      })
    } else if (format === "json") {
      // Parse JSON export options
      const options: JSONExportOptions = {
        includeMetadata: searchParams.get("includeMetadata") !== "false",
        includeValidation: searchParams.get("includeValidation") !== "false",
        minify: searchParams.get("minify") === "true",
        version: searchParams.get("version") || "1.0",
      }

      const jsonContent = exporter.exportAsJSON(formData, options)
      const exportFilename = filename || `${form.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`

      return new NextResponse(jsonContent, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${exportFilename}"`,
          "Cache-Control": "no-cache",
        },
      })
    } else {
      return NextResponse.json({ error: "Invalid format. Use 'html' or 'json'" }, { status: 400 })
    }
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Failed to export form" }, { status: 500 })
  }
}
