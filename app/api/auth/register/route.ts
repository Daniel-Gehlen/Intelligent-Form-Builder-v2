import { type NextRequest, NextResponse } from "next/server"
import { initDatabase } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()
    const db = await initDatabase()

    // Check if user already exists
    const existingUser = await db.get("SELECT id FROM users WHERE email = ?", [email])

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const result = await db.run("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)", [
      email,
      passwordHash,
      name,
    ])

    const user = await db.get("SELECT id, email, name, role FROM users WHERE id = ?", [result.lastID])

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
