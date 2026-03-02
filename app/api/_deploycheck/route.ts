import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "hi5qr-v2-deploycheck-001";

export async function GET() {
  return NextResponse.json(
    { ok: true, tag: TAG, now: new Date().toISOString() },
    { headers: { "x-hi5-deploy": TAG } }
  );
}