import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type Props = {
  params: { qrId?: string };
};

function extractQrIdFromPath(pathOrUrl: string): string | null {
  if (!pathOrUrl) return null;

  // Examples:
  // "/m/<id>"
  // "/m/<id>?ts=123"
  // "https://hi5qr.com/m/<id>?ts=123"
  try {
    const url = pathOrUrl.startsWith("http")
      ? new URL(pathOrUrl)
      : new URL(pathOrUrl, "https://hi5qr.com");

    const parts = url.pathname.split("/").filter(Boolean); // ["m", "<id>"]
    if (parts.length >= 2 && parts[0] === "m") return parts[1];
    return null;
  } catch {
    // Fallback: very simple parsing
    const cleaned = pathOrUrl.split("?")[0];
    const parts = cleaned.split("/").filter(Boolean);
    if (parts.length >= 2 && parts[0] === "m") return parts[1];
    return null;
  }
}

export default async function Mode2ViewerPage({ params }: Props) {
  // 1) Normal (expected): route param
  let qrId = params?.qrId;

  // 2) Fallback: try to recover qrId from headers if params is empty
  let headersSnapshot: Record<string, string | null> = {};
  if (!qrId) {
    const h = await headers(); // ✅ FIX: headers() is a Promise in your Next version

    const nextUrl = h.get("next-url") || h.get("x-url") || "";
    const host = h.get("x-forwarded-host") || h.get("host") || "hi5qr.com";
    const proto = h.get("x-forwarded-proto") || "https";
    const fullUrl = nextUrl
      ? `${proto}://${host}${nextUrl.startsWith("/") ? "" : "/"}${nextUrl}`
      : "";

    qrId = extractQrIdFromPath(fullUrl) || extractQrIdFromPath(nextUrl) || undefined;

    // Helpful debug snapshot (keep small & safe)
    headersSnapshot = {
      "next-url": h.get("next-url"),
      "x-url": h.get("x-url"),
      "x-forwarded-host": h.get("x-forwarded-host"),
      host: h.get("host"),
      "x-forwarded-proto": h.get("x-forwarded-proto"),
      computedFullUrl: fullUrl || null,
      extractedQrId: qrId || null,
    };
  }

  // If STILL missing, show debug (do not query DB)
  if (!qrId) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 8 }}>HI5 Viewer (Debug)</h1>

        <p style={{ marginTop: 0, opacity: 0.85 }}>
          <b>BUILD:</b> HI5_VIEWER_HEADERS_FALLBACK_AWAIT
        </p>

        <h2 style={{ marginTop: 18, marginBottom: 8, fontSize: 16 }}>Params received</h2>
        <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 12, overflowX: "auto" }}>
          {JSON.stringify(params ?? {}, null, 2)}
        </pre>

        <h2 style={{ marginTop: 18, marginBottom: 8, fontSize: 16 }}>Headers snapshot</h2>
        <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 12, overflowX: "auto" }}>
          {JSON.stringify(headersSnapshot, null, 2)}
        </pre>

        <p style={{ marginTop: 16 }}>
          ❌ <b>qrId param is empty/undefined</b>, DB lookup not executed.
        </p>

        <p style={{ opacity: 0.75, marginTop: 16 }}>
          If you see <code>Params received</code> as empty and headers don’t include <code>next-url</code>,
          it means the deployed build is not receiving route params correctly (or a rewrite is interfering).
        </p>
      </main>
    );
  }

  // ---------- DB LOOKUP ----------
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
  );

  const columns =
    "id, mode, type, status, mime_type, storage_bucket, storage_path, created_at";

  // Try common “public id” column names
  const tryCols = ["id", "qr_id", "public_id", "code", "slug"] as const;

  let found: any = null;
  const attempts: Array<{ col: string; found: boolean; error?: string }> = [];

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

  if (!found) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 8 }}>HI5 Viewer (Debug)</h1>

        <p style={{ marginTop: 0, opacity: 0.85 }}>
          <b>BUILD:</b> HI5_VIEWER_HEADERS_FALLBACK_AWAIT
        </p>

        <p style={{ marginTop: 16 }}>
          ❌ No matching row found in <code>qr_items</code> for:
        </p>

        <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 12, overflowX: "auto" }}>
          {qrId}
        </pre>

        <h2 style={{ marginTop: 18, marginBottom: 8, fontSize: 16 }}>Attempts</h2>

        <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 12, overflowX: "auto" }}>
          {JSON.stringify(attempts, null, 2)}
        </pre>

        <p style={{ opacity: 0.75, marginTop: 16 }}>
          If you see errors like “column qr_id does not exist”, that’s OK — it simply means your table
          uses a different column name. If all attempts show found=false, the record may not be in
          this Supabase project/table.
        </p>
      </main>
    );
  }

  // Normal viewer output (once found)
  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>HI5 Viewer</h1>

      <p style={{ marginTop: 0, opacity: 0.85 }}>
        <b>BUILD:</b> HI5_VIEWER_HEADERS_FALLBACK_AWAIT
      </p>

      <div style={{ opacity: 0.85, marginBottom: 16 }}>
        <div><b>QR ID:</b> {found.id}</div>
        <div><b>Mode:</b> {found.mode}</div>
        <div><b>Type:</b> {found.type}</div>
        <div><b>Status:</b> {found.status}</div>
        <div><b>MIME:</b> {found.mime_type}</div>
        <div><b>Bucket:</b> {found.storage_bucket}</div>
        <div><b>Path:</b> {found.storage_path}</div>
      </div>

      <p style={{ opacity: 0.7 }}>
        Next step: render / download the actual file from Supabase using bucket + path.
      </p>
    </main>
  );
}