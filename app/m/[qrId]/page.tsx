import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type Props = {
  // Next.js may pass params as an object OR a Promise (newer versions)
  params: { qrId?: string } | Promise<{ qrId?: string }>;
};

function isPromise<T = any>(v: any): v is Promise<T> {
  return !!v && typeof v === "object" && typeof v.then === "function";
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
          <b>BUILD:</b> HI5_VIEWER_AWAIT_PARAMS_V1
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
          <b>BUILD:</b> HI5_VIEWER_AWAIT_PARAMS_V1
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

  // ✅ Normal viewer output (once found)
  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>HI5 Viewer</h1>

      <div style={{ opacity: 0.85, marginBottom: 16 }}>
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

      <p style={{ opacity: 0.7 }}>
        Next step: render / download the actual file from Supabase using bucket + path.
      </p>
    </main>
  );
}