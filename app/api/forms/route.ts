import { type NextRequest, NextResponse } from "next/server"
import { initDatabase } from "@/lib/database"
import { formSchema } from "@/lib/validation"

export async function GET() {
  try {
    const db = await initDatabase()

    const forms = await db.all(`
      SELECT 
        f.*,
        COUNT(s.id) as submissions
      FROM forms f
      LEFT JOIN submissions s ON f.id = s.form_id
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `)

    return NextResponse.json(forms)
  } catch (error) {
    console.error("Error fetching forms:", error)
    return NextResponse.json({ error: "Failed to fetch forms" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // CSRF Protection simplificado
    const csrfToken = request.headers.get("x-csrf-token")
    if (!csrfToken) {
      return NextResponse.json({ error: "CSRF token required" }, { status: 403 })
    }

    // Validação básica do token (em produção usar validação mais robusta)
    if (csrfToken.length < 10) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = formSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    const { title, description, fields, status } = validationResult.data
    const db = await initDatabase()

    if (fields.length > 50) {
      return NextResponse.json({ error: "Too many fields (max 50)" }, { status: 400 })
    }

    const fieldIds = fields.map((f) => f.id)
    const uniqueIds = new Set(fieldIds)
    if (fieldIds.length !== uniqueIds.size) {
      return NextResponse.json({ error: "Duplicate field IDs found" }, { status: 400 })
    }

    const result = await db.run(
      `INSERT INTO forms (title, description, fields, status) 
       VALUES (?, ?, ?, ?)`,
      [title, description, JSON.stringify(fields), status],
    )

    const form = await db.get("SELECT * FROM forms WHERE id = ?", [result.lastID])

    return NextResponse.json(form, { status: 201 })
  } catch (error) {
    console.error("Error creating form:", error)
    return NextResponse.json({ error: "Failed to create form" }, { status: 500 })
  }
}
