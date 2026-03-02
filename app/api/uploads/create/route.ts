import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEPLOY_TAG = "hi5qr-v2-uploads-create-001";
const BUCKET = "hi5-uploads";

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "x-hi5-deploy": DEPLOY_TAG },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const type = String(body?.type || "");
    const originalName = String(body?.originalName || "");
    const mimeType = String(body?.mimeType || "");
    const sizeBytes = Number(body?.sizeBytes || 0);

    if (!type || !originalName || !mimeType || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      return json({ ok: false, stage: "validate", error: "Invalid body" }, 400);
    }

    // ✅ Stage 1: env presence
    const url = process.env.SUPABASE_URL ?? "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!url || !key) return json({ ok: false, stage: "env", error: "Missing SUPABASE env" }, 500);

    // ✅ Stage 2: raw fetch ping to Supabase REST (proves connectivity + URL correctness)
    const ping = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key, authorization: `Bearer ${key}` },
    });
    if (!ping.ok) {
      const t = await ping.text();
      return json(
        { ok: false, stage: "supabase-ping", status: ping.status, preview: t.slice(0, 200) },
        500
      );
    }

    // ✅ Stage 3: DB insert
    const supabaseAdmin = getSupabaseAdmin();
    const { data: row, error } = await supabaseAdmin
      .from("qr_items")
      .insert({
        mode: "MODE_2",
        type,
        status: "PENDING",
        storage_bucket: BUCKET,
        original_name: originalName,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !row?.id) {
      return json({ ok: false, stage: "db-insert", error: error?.message || "insert failed" }, 500);
    }

    return json({ ok: true, stage: "db-ok", qrId: row.id });
  } catch (e: any) {
    return json({ ok: false, stage: "catch", error: String(e?.message || e) }, 500);
  }
}