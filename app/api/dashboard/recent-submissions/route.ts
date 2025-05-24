import { NextResponse } from "next/server"
import { initDatabase } from "@/lib/database"

export async function GET() {
  try {
    const db = await initDatabase()

    const submissions = await db.all(`
      SELECT 
        s.id,
        s.created_at as submittedAt,
        f.title as formTitle,
        'new' as status
      FROM submissions s
      JOIN forms f ON s.form_id = f.id
      ORDER BY s.created_at DESC
      LIMIT 10
    `)

    return NextResponse.json(submissions)
  } catch (error) {
    console.error("Error fetching recent submissions:", error)
    return NextResponse.json({ error: "Failed to fetch recent submissions" }, { status: 500 })
  }
}
