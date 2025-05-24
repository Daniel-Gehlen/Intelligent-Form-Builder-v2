import { type NextRequest, NextResponse } from "next/server"
import { initDatabase } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await initDatabase()
    const form = await db.get("SELECT * FROM forms WHERE id = ?", [params.id])

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 })
    }

    return NextResponse.json(form)
  } catch (error) {
    console.error("Error fetching form:", error)
    return NextResponse.json({ error: "Failed to fetch form" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { title, description, fields, status } = await request.json()
    const db = await initDatabase()

    await db.run(
      `UPDATE forms 
       SET title = ?, description = ?, fields = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title, description, JSON.stringify(fields), status, params.id],
    )

    const form = await db.get("SELECT * FROM forms WHERE id = ?", [params.id])

    return NextResponse.json(form)
  } catch (error) {
    console.error("Error updating form:", error)
    return NextResponse.json({ error: "Failed to update form" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await initDatabase()

    // Delete related submissions first
    await db.run("DELETE FROM submissions WHERE form_id = ?", [params.id])

    // Delete the form
    await db.run("DELETE FROM forms WHERE id = ?", [params.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting form:", error)
    return NextResponse.json({ error: "Failed to delete form" }, { status: 500 })
  }
}
