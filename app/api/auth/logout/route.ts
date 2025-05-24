import { type NextRequest, NextResponse } from "next/server"
import { initDatabase } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (token) {
      const db = await initDatabase()
      // Remove session from database
      await db.run("DELETE FROM sessions WHERE token = ?", [token])
    }

    // Clear the cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
