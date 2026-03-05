import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type Props = {
  params?: { qrId?: string };
};

function extractQrIdFallback(): string | null {
  // On Vercel/Next, `next-url` is usually available
  const h = headers();
  const nextUrl = h.get("next-url") || h.get("x-url") || "";

  // next-url often looks like: "/m/<id>" or "/m/<id>?..."
  if (nextUrl) {
    const path = nextUrl.split("?")[0];
    const parts = path.split("/").filter(Boolean); // ["m", "<id>"]
    if (parts.length >= 2 && parts[0] === "m") return parts[1];
  }

  // As a final fallback, try the referer (browser usually sends it)
  const ref = h.get("referer") || "";
  if (ref) {
    try {
      const u = new URL(ref);
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && parts[0] === "m") return parts[1];
    } catch {}
  }

  return null;
}

export default async function Mode2ViewerPage({ params }: Props) {
  const qrIdFromParams = params?.qrId;
  const qrId = qrIdFromParams ?? extractQrIdFallback();

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const columns =
    "id, mode, type, status, mime_type, storage_bucket, storage_path, created_at";

  if (!qrId || !qrId.trim()) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
        <h1>HI5 Viewer (Debug)</h1>
        <p>❌ Could not resolve qrId from route params or headers.</p>

        <h2 style={{ marginTop: 18, fontSize: 16 }}>Params received</h2>
        <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 12, overflowX: "auto" }}>
          {JSON.stringify(params ?? {}, null, 2)}
        </pre>

        <h2 style={{ marginTop: 18, fontSize: 16 }}>Headers snapshot</h2>
        <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 12, overflowX: "auto" }}>
          {JSON.stringify(
            {
              "next-url": headers().get("next-url"),
              "x-url": headers().get("x-url"),
              referer: headers().get("referer"),
            },
            null,
            2
          )}
        </pre>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("qr_items")
    .select(columns)
    .eq("id", qrId)
    .maybeSingle();

  if (error || !data) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
        <h1>HI5 Viewer (Debug)</h1>
        <p>❌ No matching row found in qr_items for:</p>

        <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 12, overflowX: "auto" }}>
          {qrId}
        </pre>

        <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 12, overflowX: "auto" }}>
          {JSON.stringify({ error: error?.message ?? null }, null, 2)}
        </pre>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>HI5 Viewer</h1>

      <div style={{ opacity: 0.85, marginBottom: 16 }}>
        <div><b>QR ID:</b> {data.id}</div>
        <div><b>Mode:</b> {data.mode}</div>
        <div><b>Type:</b> {data.type}</div>
        <div><b>Status:</b> {data.status}</div>
        <div><b>MIME:</b> {data.mime_type}</div>
        <div><b>Bucket:</b> {data.storage_bucket}</div>
        <div><b>Path:</b> {data.storage_path}</div>
      </div>

      <p style={{ opacity: 0.7 }}>
        Next step: render / download the actual file from Supabase using bucket + path.
      </p>
    </main>
  );
}