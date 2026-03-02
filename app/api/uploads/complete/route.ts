export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const DEPLOY_TAG = "hi5qr-v2-uploads-complete-001";

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "x-hi5-deploy": DEPLOY_TAG },
  });
}

function badRequest(msg: string) {
  return json({ ok: false, stage: "validate", error: msg }, 400);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const qrId = body?.qrId;
    if (!qrId) return badRequest("Missing qrId");

    const supabaseAdmin = getSupabaseAdmin();

    // 1) Ensure the item exists
    const { data: row, error: getErr } = await supabaseAdmin
      .from("qr_items")
      .select("id,status,storage_bucket,storage_path,type,original_name,mime_type,size_bytes,created_at")
      .eq("id", qrId)
      .single();

    if (getErr || !row) {
      return json(
        { ok: false, stage: "db-get", error: getErr?.message || "QR item not found" },
        404
      );
    }

    // 2) Mark READY
    const readyAt = new Date().toISOString();
    const { error: updateErr } = await supabaseAdmin
      .from("qr_items")
      .update({ status: "READY", ready_at: readyAt })
      .eq("id", qrId);

    if (updateErr) {
      return json({ ok: false, stage: "db-update", error: updateErr.message }, 500);
    }

    // 3) Return final info
    return json({
      ok: true,
      stage: "complete-ok",
      qrId: row.id,
      item: {
        status: "READY",
        type: row.type,
        storage: {
          bucket: row.storage_bucket,
          path: row.storage_path,
        },
        originalName: row.original_name,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        createdAt: row.created_at,
        readyAt,
      },
    });
  } catch (err: any) {
    return json({ ok: false, stage: "server", error: err?.message || "Server error" }, 500);
  }
}