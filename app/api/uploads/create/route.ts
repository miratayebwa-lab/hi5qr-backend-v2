// app/api/uploads/create/route.ts

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "hi5-uploads";
const UPLOAD_EXPIRES_SECONDS = 600; // 10 minutes
const DEPLOY_TAG = "hi5qr-v2-uploads-create-002";

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "x-hi5-deploy": DEPLOY_TAG },
  });
}

function badRequest(msg: string) {
  return json({ ok: false, stage: "validate", error: msg }, 400);
}

function safeFileName(name: string) {
  const base = (name || "file").trim();
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.length ? cleaned : "file";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");

    const typeRaw = body?.type;
    const originalName = body?.originalName;
    const mimeType = body?.mimeType;
    const sizeBytesRaw = body?.sizeBytes;

    const type = String(typeRaw || "").trim().toUpperCase();
    const sizeBytes = Number(sizeBytesRaw);

    if (!type) return badRequest("Missing type");
    if (!originalName) return badRequest("Missing originalName");
    if (!mimeType) return badRequest("Missing mimeType");
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      return badRequest("sizeBytes must be a positive number");
    }

    const fileName = safeFileName(originalName);

    // ✅ IMPORTANT: create admin client here
    const supabaseAdmin = getSupabaseAdmin();

    // 1) Insert DB row (PENDING)
    const { data: row, error: insertErr } = await supabaseAdmin
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

    if (insertErr || !row) {
      return json(
        { ok: false, stage: "db-insert", error: insertErr?.message || "Insert failed" },
        500
      );
    }

    const qrId = String(row.id);

    // 2) Storage path
    const path = `mode2/${qrId}/${fileName}`;

    // 3) Update row with storage_path
    const { error: updateErr } = await supabaseAdmin
      .from("qr_items")
      .update({ storage_path: path })
      .eq("id", qrId);

    if (updateErr) {
      return json({ ok: false, stage: "db-update", error: updateErr.message }, 500);
    }

    // 4) Create signed upload URL (✅ correct for your supabase-js types)
    const { data: signed, error: signedErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path, { upsert: false });

    if (signedErr || !signed?.signedUrl) {
      return json(
        {
          ok: false,
          stage: "storage-signed-upload",
          error: signedErr?.message || "Failed to create signed upload URL",
        },
        500
      );
    }

    // ✅ Locked response shape that Android expects
    return json({
      ok: true,
      stage: "signed-upload-ok",
      qrId,
      upload: {
        bucket: BUCKET,
        path,
        signedUrl: signed.signedUrl,
        expiresSeconds: UPLOAD_EXPIRES_SECONDS,
      },
    });
  } catch (err: any) {
    return json(
      {
        ok: false,
        stage: "server",
        error: err?.message || "Server error",
      },
      500
    );
  }
}