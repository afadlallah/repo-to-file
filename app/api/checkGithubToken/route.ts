import { NextResponse } from 'next/server'

export async function GET() {
  const token = process.env.GITHUB_ACCESS_TOKEN

  return NextResponse.json({ hasToken: !!token })
}
