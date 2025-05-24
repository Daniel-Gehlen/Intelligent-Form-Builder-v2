import { type NextRequest, NextResponse } from "next/server"
import { initDatabase } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"
    const range = searchParams.get("range") || "7d"
    const formId = searchParams.get("formId")

    const db = await initDatabase()

    let query = `
      SELECT s.*, f.title as form_title
      FROM submissions s
      JOIN forms f ON s.form_id = f.id
    `
    const params: any[] = []

    // Add date filter
    let daysBack = 7
    switch (range) {
      case "30d":
        daysBack = 30
        break
      case "90d":
        daysBack = 90
        break
      case "1y":
        daysBack = 365
        break
    }

    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - daysBack)

    query += " WHERE s.created_at >= ?"
    params.push(dateThreshold.toISOString())

    if (formId) {
      query += " AND s.form_id = ?"
      params.push(formId)
    }

    query += " ORDER BY s.created_at DESC"

    const submissions = await db.all(query, params)

    if (format === "json") {
      return NextResponse.json(submissions)
    }

    // Generate CSV
    if (submissions.length === 0) {
      return new NextResponse("No data to export", { status: 404 })
    }

    // Get all unique keys from submission data
    const allKeys = new Set<string>()
    submissions.forEach((submission) => {
      const data = JSON.parse(submission.data)
      Object.keys(data).forEach((key) => allKeys.add(key))
    })

    const headers = ["ID", "Form", "Submitted At", ...Array.from(allKeys)]
    const csvRows = [headers.join(",")]

    submissions.forEach((submission) => {
      const data = JSON.parse(submission.data)
      const row = [
        submission.id,
        `"${submission.form_title}"`,
        submission.created_at,
        ...Array.from(allKeys).map((key) => `"${data[key] || ""}"`),
      ]
      csvRows.push(row.join(","))
    })

    const csvContent = csvRows.join("\n")

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="submissions-${range}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting submissions:", error)
    return NextResponse.json({ error: "Failed to export submissions" }, { status: 500 })
  }
}
