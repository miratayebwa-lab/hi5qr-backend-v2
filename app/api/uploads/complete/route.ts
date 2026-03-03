export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET_DEFAULT = "hi5-uploads";
const DEPLOY_TAG = "hi5qr-v2-uploads-complete-002";

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "x-hi5-deploy": DEPLOY_TAG },
  });
}

function badRequest(msg: string, extra?: any) {
  return json({ ok: false, stage: "validate", error: msg, ...extra }, 400);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const qrId = (body?.qrId ?? "").toString().trim();

    if (!qrId) return badRequest("Missing qrId");

    const supabaseAdmin = getSupabaseAdmin();

    // 1) Load row first so we can satisfy the READY constraint rules.
    const { data: row, error: fetchErr } = await supabaseAdmin
      .from("qr_items")
      .select("id, mode, type, status, storage_bucket, storage_path, text_content, mime_type, size_bytes")
      .eq("id", qrId)
      .maybeSingle();

    if (fetchErr) {
      return json({ ok: false, stage: "db-fetch", error: fetchErr.message }, 500);
    }
    if (!row) {
      return json({ ok: false, stage: "db-fetch", error: "qrId not found" }, 404);
    }

    // 2) Validate READY rules (match your constraint intent)
    const type = row.type as string;

    const isText = type === "TEXT";
    const hasFilePath = !!row.storage_path;
    const hasText = !!row.text_content;

    if (isText) {
      // For TEXT, content must exist (and usually storage_path is not required)
      if (!hasText) {
        return badRequest("TEXT item cannot be completed without text_content", {
          hint: "Make sure TEXT creation stored text_content before calling /complete",
        });
      }
    } else {
      // For file types, path must exist before completion
      if (!hasFilePath) {
        return badRequest("File item cannot be completed without storage_path", {
          hint: "This qrId may have been created before path was saved. Create a new qrId using /uploads/create.",
        });
      }
      // Optional extra safety checks (won’t block unless missing)
      if (!row.mime_type || typeof row.size_bytes !== "number") {
        return badRequest("File item missing mime_type or size_bytes", {
          hint: "Recreate using /uploads/create so metadata is stored correctly.",
        });
      }
    }

    // 3) Update to READY + set ready_at (this is usually what the constraint demands)
    const now = new Date().toISOString();
    const storage_bucket = row.storage_bucket || BUCKET_DEFAULT;

    const { error: updateErr } = await supabaseAdmin
      .from("qr_items")
      .update({
        status: "READY",
        ready_at: now,
        storage_bucket,
      })
      .eq("id", qrId);

    if (updateErr) {
      return json({ ok: false, stage: "db-update", error: updateErr.message }, 500);
    }

    return json({
      ok: true,
      stage: "complete-ok",
      qrId,
      status: "READY",
      readyAt: now,
    });
  } catch (err: any) {
    return json({ ok: false, stage: "server", error: err?.message || "Server error" }, 500);
  }
}