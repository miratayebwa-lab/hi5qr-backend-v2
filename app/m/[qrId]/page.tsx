import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  // Next.js may pass params as an object OR a Promise (newer versions)
  params: { qrId?: string } | Promise<{ qrId?: string }>;
};

function isPromise<T = any>(v: any): v is Promise<T> {
  return !!v && typeof v === "object" && typeof (v as any).then === "function";
}

function isPdf(mime?: string | null, type?: string | null) {
  return (mime ?? "") === "application/pdf" || (type ?? "").toUpperCase() === "PDF";
}

function isImage(mime?: string | null, type?: string | null) {
  const m = (mime ?? "").toLowerCase();
  const t = (type ?? "").toUpperCase();
  return m.startsWith("image/") || t === "IMAGE" || t === "IMG" || t === "PHOTO";
}

function isAudio(mime?: string | null, type?: string | null) {
  const m = (mime ?? "").toLowerCase();
  const t = (type ?? "").toUpperCase();
  return m.startsWith("audio/") || t === "AUDIO";
}

function isVideo(mime?: string | null, type?: string | null) {
  const m = (mime ?? "").toLowerCase();
  const t = (type ?? "").toUpperCase();
  return m.startsWith("video/") || t === "VIDEO";
}

export default async function Mode2ViewerPage({ params }: Props) {
  // ✅ Robustly resolve params (works on Next versions where params is a Promise)
  const resolvedParams = isPromise<{ qrId?: string }>(params) ? await params : params;
  const qrId = resolvedParams?.qrId;

  // ✅ Supabase (server-only)
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const columns =
    "id, mode, type, status, mime_type, storage_bucket, storage_path, created_at";

  // Common “public id” column names (we try them in order)
  const tryCols = ["id", "qr_id", "public_id", "code", "slug"] as const;

  let found: any = null;
  const attempts: Array<{ col: string; found: boolean; error?: string }> = [];

  // ✅ If qrId is missing, show debug immediately
  if (!qrId || qrId === "undefined") {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 8 }}>HI5 Viewer (Debug)</h1>

        <p style={{ marginTop: 0, opacity: 0.85 }}>
          <b>BUILD:</b> HI5_VIEWER_SIGNEDURL_V2
        </p>

        <h2 style={{ marginTop: 18, marginBottom: 8, fontSize: 16 }}>Params received</h2>
        <pre
          style={{
            background: "#f6f6f6",
            padding: 12,
            borderRadius: 12,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(resolvedParams ?? {}, null, 2)}
        </pre>

        <p style={{ marginTop: 16 }}>
          ❌ <b>qrId param is empty/undefined</b>, DB lookup not executed.
        </p>

        <p style={{ opacity: 0.75, marginTop: 16 }}>
          If your URL is like <code>/m/REAL_ID</code> but this shows undefined, your deployed build
          isn’t receiving the route params correctly (or a rewrite/middleware is interfering).
        </p>
      </main>
    );
  }

  // ✅ Try lookups across possible id columns
  for (const col of tryCols) {
    const { data, error } = await supabase
      .from("qr_items")
      .select(columns)
      .eq(col, qrId)
      .maybeSingle();

    attempts.push({
      col,
      found: !!data,
      error: error?.message,
    });

    if (data) {
      found = data;
      break;
    }
  }

  // ✅ Debug if not found
  if (!found) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 8 }}>HI5 Viewer (Debug)</h1>

        <p style={{ marginTop: 0, opacity: 0.85 }}>
          <b>BUILD:</b> HI5_VIEWER_SIGNEDURL_V2
        </p>

        <p style={{ marginTop: 0 }}>
          ❌ No matching row found in <code>qr_items</code> for:
        </p>

        <pre
          style={{
            background: "#f6f6f6",
            padding: 12,
            borderRadius: 12,
            overflowX: "auto",
          }}
        >
          {qrId}
        </pre>

        <h2 style={{ marginTop: 18, marginBottom: 8, fontSize: 16 }}>Attempts</h2>

        <pre
          style={{
            background: "#f6f6f6",
            padding: 12,
            borderRadius: 12,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(attempts, null, 2)}
        </pre>

        <p style={{ opacity: 0.75, marginTop: 16 }}>
          If you see errors like <code>column qr_items.qr_id does not exist</code>, that’s OK — it
          just means your table uses a different column name. If <b>all</b> attempts show{" "}
          <code>found=false</code>, then either:
          <br />• the record isn’t in this Supabase project/table, or
          <br />• you’re looking up the wrong column, or
          <br />• RLS/policies are blocking reads (less likely because service key is used).
        </p>
      </main>
    );
  }

  // ✅ Create signed URL to view/download file
  let signedUrl: string | null = null;
  let signedErr: string | null = null;

  if (found.storage_bucket && found.storage_path) {
    const { data: signed, error: sErr } = await supabase.storage
      .from(found.storage_bucket)
      .createSignedUrl(found.storage_path, 60 * 10); // 10 minutes

    if (sErr) signedErr = sErr.message;
    signedUrl = signed?.signedUrl ?? null;
  } else {
    signedErr = "Missing storage_bucket or storage_path on this row.";
  }

  // If we have the row but cannot sign a URL, that’s a real issue → keep showing the page (not 404)
  const kind = {
    pdf: isPdf(found.mime_type, found.type),
    image: isImage(found.mime_type, found.type),
    audio: isAudio(found.mime_type, found.type),
    video: isVideo(found.mime_type, found.type),
  };

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>HI5 Viewer</h1>

      <div style={{ opacity: 0.9, marginBottom: 16, lineHeight: 1.6 }}>
        <div>
          <b>QR ID:</b> {found.id}
        </div>
        <div>
          <b>Mode:</b> {found.mode}
        </div>
        <div>
          <b>Type:</b> {found.type}
        </div>
        <div>
          <b>Status:</b> {found.status}
        </div>
        <div>
          <b>MIME:</b> {found.mime_type}
        </div>
        <div>
          <b>Bucket:</b> {found.storage_bucket}
        </div>
        <div>
          <b>Path:</b> {found.storage_path}
        </div>
      </div>

      {/* Signed URL block */}
      {!signedUrl ? (
        <div
          style={{
            background: "#fff3cd",
            border: "1px solid #ffe69c",
            padding: 12,
            borderRadius: 12,
            marginBottom: 16,
          }}
        >
          <b>⚠️ Could not create signed URL</b>
          <div style={{ marginTop: 6, opacity: 0.85 }}>{signedErr ?? "Unknown error"}</div>

          <p style={{ marginTop: 10, opacity: 0.75 }}>
            Check:
            <br />• the bucket really is <code>{String(found.storage_bucket)}</code>
            <br />• the file exists at <code>{String(found.storage_path)}</code>
            <br />• Vercel env vars <code>SUPABASE_URL</code> and{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> are correct for the same Supabase project
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <a
            href={signedUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              padding: "10px 14px",
              borderRadius: 12,
              background: "#111",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ⬇️ Download / Open file
          </a>

          <span style={{ opacity: 0.7, fontSize: 13 }}>Link expires in ~10 minutes.</span>
        </div>
      )}

      {/* Inline previews */}
      {signedUrl && kind.pdf && (
        <section>
          <h2 style={{ fontSize: 16, margin: "18px 0 10px" }}>Preview</h2>

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              overflow: "hidden",
              height: "75vh",
              background: "#fafafa",
            }}
          >
            <iframe
              src={signedUrl}
              title="HI5 PDF Preview"
              style={{ width: "100%", height: "100%", border: 0 }}
            />
          </div>

          <p style={{ opacity: 0.7, marginTop: 10 }}>
            If the PDF doesn’t render on some phones, the download button above will still work.
          </p>
        </section>
      )}

      {signedUrl && kind.image && (
        <section>
          <h2 style={{ fontSize: 16, margin: "18px 0 10px" }}>Preview</h2>
          <img
            src={signedUrl}
            alt="HI5 Image Preview"
            style={{
              width: "100%",
              borderRadius: 12,
              border: "1px solid #ddd",
              background: "#fafafa",
            }}
          />
        </section>
      )}

      {signedUrl && kind.audio && (
        <section>
          <h2 style={{ fontSize: 16, margin: "18px 0 10px" }}>Preview</h2>
          <audio controls src={signedUrl} style={{ width: "100%" }} />
          <p style={{ opacity: 0.7, marginTop: 10 }}>
            If audio fails to play in-browser on some devices, use the download button above.
          </p>
        </section>
      )}

      {signedUrl && kind.video && (
        <section>
          <h2 style={{ fontSize: 16, margin: "18px 0 10px" }}>Preview</h2>
          <video controls src={signedUrl} style={{ width: "100%", borderRadius: 12, border: "1px solid #ddd" }} />
          <p style={{ opacity: 0.7, marginTop: 10 }}>
            If video streaming is slow, use the download button above.
          </p>
        </section>
      )}

      {signedUrl && !kind.pdf && !kind.image && !kind.audio && !kind.video && (
        <p style={{ opacity: 0.7 }}>
          Preview for this file type will be added next. For now use the download button above.
        </p>
      )}
    </main>
  );
}