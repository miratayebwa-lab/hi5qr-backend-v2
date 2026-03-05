import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type Props = {
  params: { qrId: string };
};

export default async function Mode2ViewerPage({ params }: Props) {
  const qrId = params?.qrId;

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

  // If qrId is missing/empty, skip DB attempts and show debug immediately
  if (qrId && qrId.trim().length > 0) {
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
  }

  // ✅ Debug page (prints params + qrId + attempts)
  if (!found) {
    return (
      <main
        style={{
          padding: 24,
          fontFamily: "system-ui",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <h1 style={{ marginBottom: 8 }}>HI5 Viewer (Debug)</h1>

        <h2 style={{ marginTop: 18, marginBottom: 8, fontSize: 16 }}>
          Params received
        </h2>
        <pre
          style={{
            background: "#f6f6f6",
            padding: 12,
            borderRadius: 12,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(params, null, 2)}
        </pre>

        <p style={{ marginTop: 16 }}>
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
          {String(qrId)}
        </pre>

        <h2 style={{ marginTop: 18, marginBottom: 8, fontSize: 16 }}>
          Attempts
        </h2>

        <pre
          style={{
            background: "#f6f6f6",
            padding: 12,
            borderRadius: 12,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(
            qrId && qrId.trim().length > 0
              ? attempts
              : [
                  {
                    col: "(skipped)",
                    found: false,
                    error: "qrId param is empty/undefined, DB lookup not executed",
                  },
                ],
            null,
            2
          )}
        </pre>

        <p style={{ opacity: 0.75, marginTop: 16 }}>
          If you see an error like{" "}
          <code>invalid input syntax for type uuid: "undefined"</code>, it means
          the value being used for the lookup is literally "undefined" (your
          URL or app is generating the link incorrectly).
          <br />
          If you see errors like{" "}
          <code>column qr_items.qr_id does not exist</code>, that’s OK — it
          simply means your table uses a different column name.
        </p>
      </main>
    );
  }

  // Normal viewer output (once found)
  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
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
        Next step: render / download the actual file from Supabase using bucket +
        path.
      </p>
    </main>
  );
}