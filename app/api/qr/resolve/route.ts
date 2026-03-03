export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const DEPLOY_TAG = "hi5qr-v2-qr-resolve-001";
const SIGNED_DOWNLOAD_EXPIRES_SECONDS = 60 * 60; // 1 hour

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "x-hi5-deploy": DEPLOY_TAG },
  });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const qrId = url.searchParams.get("qrId")?.trim();

    if (!qrId) return json({ ok: false, stage: "validate", error: "Missing qrId" }, 400);

    const supabaseAdmin = getSupabaseAdmin();

    // 1) Fetch item
    const { data: item, error: fetchErr } = await supabaseAdmin
      .from("qr_items")
      .select("id, mode, type, status, text_content, storage_bucket, storage_path, created_at, ready_at")
      .eq("id", qrId)
      .single();

    if (fetchErr || !item) {
      return json(
        { ok: false, stage: "db-fetch", error: fetchErr?.message || "Not found" },
        404
      );
    }

    if (item.status !== "READY") {
      return json(
        { ok: false, stage: "not-ready", qrId, status: item.status },
        409
      );
    }

    // 2) TEXT returns directly
    if (item.type === "TEXT") {
      return json({
        ok: true,
        stage: "resolve-ok",
        qrId,
        mode: item.mode,
        type: item.type,
        createdAt: item.created_at,
        readyAt: item.ready_at,
        content: item.text_content ?? "",
      });
    }

    // 3) FILE types -> signed download URL
    const bucket = item.storage_bucket || "hi5-uploads";
    const path = item.storage_path;

    if (!path) {
      return json({ ok: false, stage: "missing-path", error: "storage_path missing" }, 500);
    }

    const { data: signed, error: signedErr } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, SIGNED_DOWNLOAD_EXPIRES_SECONDS);

    if (signedErr || !signed?.signedUrl) {
      return json(
        { ok: false, stage: "signed-download", error: signedErr?.message || "Failed to sign download" },
        500
      );
    }

    return json({
      ok: true,
      stage: "resolve-ok",
      qrId,
      mode: item.mode,
      type: item.type,
      createdAt: item.created_at,
      readyAt: item.ready_at,
      file: {
        bucket,
        path,
        signedUrl: signed.signedUrl,
        expiresSeconds: SIGNED_DOWNLOAD_EXPIRES_SECONDS,
      },
    });
  } catch (err: any) {
    return json({ ok: false, stage: "server", error: err?.message || "Server error" }, 500);
  }
}