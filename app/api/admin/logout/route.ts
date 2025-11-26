import { NextResponse } from "next/server"
import {
  getSessionFromCookies,
  destroySession,
  SESSION_COOKIE_NAME,
} from "@/lib/admin-auth"

export async function POST() {
  try {
    const token = await getSessionFromCookies()

    if (token) {
      destroySession(token)
    }

    const response = NextResponse.json({ success: true })

    // Clear the session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
