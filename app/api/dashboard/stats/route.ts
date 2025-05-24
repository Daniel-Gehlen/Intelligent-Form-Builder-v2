import { type NextRequest, NextResponse } from "next/server"
import { initDatabase } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "7d"

    const db = await initDatabase()

    // Calculate date range
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

    // Get stats
    const [totalForms, totalSubmissions, recentSubmissions] = await Promise.all([
      db.get("SELECT COUNT(*) as count FROM forms"),
      db.get("SELECT COUNT(*) as count FROM submissions"),
      db.get("SELECT COUNT(*) as count FROM submissions WHERE created_at >= ?", [dateThreshold.toISOString()]),
    ])

    // Calculate conversion rate (simplified)
    const conversionRate =
      totalSubmissions.count > 0 ? Math.round((recentSubmissions.count / totalSubmissions.count) * 100) : 0

    // Active users (simplified - unique IP addresses in the time range)
    const activeUsers = await db.get(
      "SELECT COUNT(DISTINCT ip_address) as count FROM submissions WHERE created_at >= ?",
      [dateThreshold.toISOString()],
    )

    return NextResponse.json({
      totalForms: totalForms.count,
      totalSubmissions: totalSubmissions.count,
      activeUsers: activeUsers.count,
      conversionRate,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
